import { Injectable, Logger } from '@nestjs/common';
import {
  IJobStore,
  IStoreMetadata,
  ERR_STORE_NOT_FOUND,
} from '@ever-jobs/models';

/**
 * Kebab-case validator for store ids (Spec 004 / FR-4).
 *
 * `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` — must start with a lowercase letter,
 * may contain digits, and uses single hyphens as the only separator.
 * This rejects: empty / whitespace, uppercase (`Postgres`), snake_case
 * (`my_store`), leading/trailing hyphens, double hyphens, and digits-first
 * (`2pg`). Pinned in the test suite — backend authors discovering the
 * regex via failing tests is preferable to silent ID collisions later.
 */
const STORE_ID_KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Error thrown by {@link StoreRegistry} for unknown / invalid / duplicate
 * ids. The `code` field uses Spec 004 §7.3 codes when applicable
 * ({@link ERR_STORE_NOT_FOUND} for `get(unknown)`); registration-time
 * failures use synthesised `ERR_STORE_*` codes (`ERR_STORE_INVALID_ID`,
 * `ERR_STORE_DUPLICATE_ID`) so operators can grep them out of logs even
 * though the spec only lists `ERR_STORE_NOT_FOUND` (those two are
 * registration-time programmer errors, not runtime / wire errors —
 * keeping them out of §7.3 keeps the wire contract small).
 */
export class StoreRegistryError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'StoreRegistryError';
    this.code = code;
  }
}

/**
 * Registry-time error code: an `@StorePlugin({ id })` id failed validation
 * (empty, non-kebab-case, or otherwise malformed). Not part of Spec 004
 * §7.3 because it's a bootstrap-time programmer error rather than a
 * runtime wire error — but exported so operators can grep startup logs.
 */
export const ERR_STORE_INVALID_ID = 'ERR_STORE_INVALID_ID';

/**
 * Registry-time error code: two `@StorePlugin()` providers registered
 * the same id. Same rationale as {@link ERR_STORE_INVALID_ID} for being
 * a registry-local code rather than a §7.3 wire code.
 */
export const ERR_STORE_DUPLICATE_ID = 'ERR_STORE_DUPLICATE_ID';

/**
 * Central registry of all `@StorePlugin()`-decorated backends
 * (Spec 004 / T03).
 *
 * Mirrors the `PluginRegistry` pattern used for source plugins:
 * a pure data structure that records `(id → store, metadata)` pairs.
 * Population is the responsibility of a separate discovery service
 * (T03 fall-back populates manually; a future task may add a
 * `DiscoveryService`-driven `StoreDiscoveryService` analogous to
 * `PluginDiscoveryService`).
 *
 * The downstream `StoreModule.forActive(storeId)` (Spec 004 / T04)
 * consults `get(id)` at bootstrap to bind the matching backend to
 * `JOB_STORE_TOKEN`; bootstrap MUST fail fast with
 * {@link ERR_STORE_NOT_FOUND} when `EVER_JOBS_STORE` references an
 * unknown id (Spec 004 §7.3).
 *
 * @example
 * ```typescript
 * registry.register({ id: 'memory' }, new InMemoryJobStore());
 * registry.has('memory');              // true
 * registry.get('memory');              // InMemoryJobStore instance
 * registry.listIds();                  // ['memory']
 * registry.get('postgres');            // throws ERR_STORE_NOT_FOUND
 * registry.register({ id: 'memory' }, …);  // throws ERR_STORE_DUPLICATE_ID
 * registry.register({ id: 'My_Store' }, …); // throws ERR_STORE_INVALID_ID
 * ```
 */
@Injectable()
export class StoreRegistry {
  private readonly logger = new Logger(StoreRegistry.name);
  private readonly stores = new Map<string, IJobStore>();
  private readonly metadata = new Map<string, IStoreMetadata>();

  /**
   * Register a backend plugin. Validates `id` (non-empty kebab-case)
   * and rejects duplicates. On any rejection the registry state is
   * unchanged — partial registration would leave the registry in an
   * inconsistent state where `has()` reports `true` for an id whose
   * `IStoreMetadata` is missing.
   */
  register(metadata: IStoreMetadata, store: IJobStore): void {
    const id = metadata?.id;

    if (typeof id !== 'string' || id.trim().length === 0) {
      const message = `Store plugin id must be a non-empty string (got ${JSON.stringify(id)})`;
      this.logger.error(message);
      throw new StoreRegistryError(message, ERR_STORE_INVALID_ID);
    }

    if (!STORE_ID_KEBAB_CASE_RE.test(id)) {
      const message =
        `Store plugin id '${id}' is not kebab-case ` +
        `(must match ${STORE_ID_KEBAB_CASE_RE} — e.g. 'postgres', 'sqlite', 'store-postgres-prisma')`;
      this.logger.error(message);
      throw new StoreRegistryError(message, ERR_STORE_INVALID_ID);
    }

    if (this.stores.has(id)) {
      const existing = this.metadata.get(id);
      const message =
        `Store plugin id '${id}' is already registered ` +
        `(existing: ${existing?.description ?? '<no description>'}). ` +
        `Each store plugin MUST have a unique id.`;
      this.logger.error(message);
      throw new StoreRegistryError(message, ERR_STORE_DUPLICATE_ID);
    }

    this.stores.set(id, store);
    this.metadata.set(id, metadata);
    this.logger.log(
      `Registered store plugin: ${id}${metadata.description ? ` (${metadata.description})` : ''}`,
    );
  }

  /**
   * Look up a backend by id; throws {@link StoreRegistryError} with
   * {@link ERR_STORE_NOT_FOUND} when unknown. Use {@link tryGet} when
   * the absence of the id is non-fatal (e.g. CLI listing).
   */
  get(id: string): IJobStore {
    const store = this.stores.get(id);
    if (!store) {
      throw new StoreRegistryError(
        `Unknown store plugin id: '${id}'. Registered ids: [${this.listIds().join(', ')}]`,
        ERR_STORE_NOT_FOUND,
      );
    }
    return store;
  }

  /**
   * Non-throwing variant of {@link get}. Returns `undefined` when the
   * id is unknown — useful for diagnostic / listing code paths.
   */
  tryGet(id: string): IJobStore | undefined {
    return this.stores.get(id);
  }

  /**
   * `true` iff a backend is registered under the given id. Cheap (O(1));
   * safe to call from hot paths.
   */
  has(id: string): boolean {
    return this.stores.has(id);
  }

  /**
   * Static metadata for a registered backend, or `undefined` when
   * unknown. The returned object is the one passed to {@link register} —
   * callers MUST treat it as immutable.
   */
  getMetadata(id: string): IStoreMetadata | undefined {
    return this.metadata.get(id);
  }

  /**
   * Ids of every registered backend, in insertion order (matches
   * `PluginRegistry.listSiteKeys()`).
   */
  listIds(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Metadata for every registered backend, in insertion order.
   * Surface for `GET /api/storage` and the CLI's `stores list` subcommand.
   */
  listMetadata(): IStoreMetadata[] {
    return Array.from(this.metadata.values());
  }

  /** Total registered backends. */
  get size(): number {
    return this.stores.size;
  }
}
