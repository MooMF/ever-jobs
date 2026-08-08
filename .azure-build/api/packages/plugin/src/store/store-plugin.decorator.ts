import { SetMetadata } from '@nestjs/common';
import {
  IStoreMetadata,
  STORE_PLUGIN_METADATA_KEY,
} from '@ever-jobs/models';

/**
 * Class decorator that marks a NestJS provider as a persistent-store
 * backend (Spec 004 / FR-4 / T02).
 *
 * The decorator is a thin wrapper around `SetMetadata` — it attaches an
 * {@link IStoreMetadata} object to the class under
 * {@link STORE_PLUGIN_METADATA_KEY}. The downstream `StoreRegistry`
 * (Spec 004 / T03) reads the metadata via the NestJS `Reflector`,
 * indexes plugins by `id`, and at bootstrap binds the one matching
 * `EVER_JOBS_STORE` to {@link JOB_STORE_TOKEN} via
 * `StoreModule.forActive(storeId)` (Spec 004 / T04).
 *
 * Validation of `id` (kebab-case, non-empty, no duplicates) lives in
 * the registry rather than the decorator, mirroring the way
 * `@SourcePlugin()` defers `Site`-uniqueness checks to
 * `PluginDiscoveryService`. Decoration runs at class-load time, before
 * the logger is wired up, so a thrown error there would surface as a
 * cryptic stack trace rather than as a structured registry log line.
 *
 * @example
 * ```typescript
 * @StorePlugin({ id: 'postgres', description: 'Postgres + Prisma' })
 * @Injectable()
 * export class PostgresJobStore implements IJobStore { ... }
 * ```
 */
export const StorePlugin = (metadata: IStoreMetadata): ClassDecorator => {
  return SetMetadata(STORE_PLUGIN_METADATA_KEY, metadata);
};

/**
 * Re-export of the metadata key so plugin authors and the
 * forthcoming `StoreRegistry` (T03) can resolve it from
 * `@ever-jobs/plugin` without reaching back into `@ever-jobs/models`.
 */
export { STORE_PLUGIN_METADATA_KEY } from '@ever-jobs/models';
