import 'reflect-metadata';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CanonicalJob,
  HEALTH_SNAPSHOT_STORE_TOKEN,
  HealthSnapshotQuery,
  HealthSnapshotRow,
  IHealthSnapshotStore,
  IJobObservationStore,
  IJobStore,
  JobStorePage,
  JobStoreQuery,
  JOB_OBSERVATION_STORE_TOKEN,
  JOB_STORE_TOKEN,
  ERR_STORE_NOT_FOUND,
  Site,
  SourceHealth,
  SourceObservation,
} from '@ever-jobs/models';
import {
  ERR_STORE_DUPLICATE_ID,
  StoreRegistry,
  StoreRegistryError,
} from '../store-registry.service';
import { StorePlugin } from '../store-plugin.decorator';
import {
  ERR_STORE_ACTIVE_ID_REQUIRED,
  ERR_STORE_BACKEND_NOT_DECORATED,
  StoreModule,
  StoreModuleConfigurationError,
} from '../store.module';

/**
 * Spec 004 / T04 — `StoreModule.forActive(storeId)` unit tests.
 *
 * Wires together T01 (interfaces), T02 (decorator), and T03 (registry).
 * The factory's job is narrow but load-bearing: at bootstrap, take a
 * declared list of `@StorePlugin()`-decorated backends, instantiate
 * them through NestJS DI, register them with `StoreRegistry`, and bind
 * the one matching `storeId` to `JOB_STORE_TOKEN` (and, by default,
 * `JOB_OBSERVATION_STORE_TOKEN`). These tests pin:
 *
 *   1. Happy path: chosen backend resolves through `JOB_STORE_TOKEN`.
 *   2. Both tokens point at the same instance by default
 *      (Spec 004 §7 — single backend implements both contracts).
 *   3. `bindObservationStore: false` suppresses the second binding.
 *   4. Unknown `storeId` propagates `ERR_STORE_NOT_FOUND` from the
 *      registry (Spec 004 §7.3).
 *   5. Empty / blank `storeId` is rejected with
 *      `ERR_STORE_ACTIVE_ID_REQUIRED` before NestJS construction.
 *   6. Backend missing `@StorePlugin()` is rejected with
 *      `ERR_STORE_BACKEND_NOT_DECORATED` before NestJS construction.
 *   7. Duplicate-id collisions across two backends propagate
 *      `ERR_STORE_DUPLICATE_ID` from the registry.
 *   8. The same `StoreRegistry` instance is reachable via DI alongside
 *      the active store binding (so admin endpoints can list every
 *      registered backend, not just the active one).
 *   9. The dynamic module is `global` — a downstream feature module
 *      can inject `JOB_STORE_TOKEN` without re-importing.
 *  10. Multi-backend selection: two backends registered, only the one
 *      matching `storeId` is bound to the token; both remain in the
 *      registry for diagnostic listing.
 */
describe('StoreModule.forActive (Spec 004 / T04)', () => {
  /**
   * Minimal `IJobStore` stub — every method satisfies the type and
   * returns deterministic fixtures so a downstream test can assert
   * "JOB_STORE_TOKEN resolves to *this* backend" by tag.
   */
  abstract class StubJobStore implements IJobStore, IJobObservationStore {
    abstract readonly tag: string;

    upsert(job: CanonicalJob): Promise<CanonicalJob> {
      return Promise.resolve(job);
    }
    upsertMany(): Promise<{ inserted: number; updated: number }> {
      return Promise.resolve({ inserted: 0, updated: 0 });
    }
    getById(): Promise<CanonicalJob | null> {
      return Promise.resolve(null);
    }
    findByCanonicalId(): Promise<CanonicalJob | null> {
      return Promise.resolve(null);
    }
    listByQuery(_q: JobStoreQuery): Promise<JobStorePage<CanonicalJob>> {
      return Promise.resolve({ items: [] });
    }
    delete(): Promise<boolean> {
      return Promise.resolve(false);
    }
    putAll(
      _id: string,
      _o: ReadonlyArray<SourceObservation>,
    ): Promise<void> {
      return Promise.resolve();
    }
    listByCanonicalId(): Promise<ReadonlyArray<SourceObservation>> {
      return Promise.resolve([]);
    }
    deleteByCanonicalId(): Promise<number> {
      return Promise.resolve(0);
    }
  }

  @StorePlugin({ id: 'memory', description: 'In-memory store (dev)' })
  @Injectable()
  class MemoryStubStore extends StubJobStore {
    readonly tag = 'memory';
  }

  /**
   * Stub backend that ALSO implements `IHealthSnapshotStore` — used to
   * exercise the `bindHealthSnapshotStore` factory path. Mirrors the
   * in-memory plugin's "single class implements three interfaces"
   * pattern.
   */
  @StorePlugin({ id: 'memory-snap', description: 'Snapshot-aware stub' })
  @Injectable()
  class SnapshotAwareStubStore
    extends StubJobStore
    implements IHealthSnapshotStore
  {
    readonly tag = 'memory-snap';
    putBatch(): Promise<{ inserted: number }> {
      return Promise.resolve({ inserted: 0 });
    }
    listSince(
      _since: Date,
      _opts?: HealthSnapshotQuery,
    ): Promise<ReadonlyArray<HealthSnapshotRow>> {
      return Promise.resolve([]);
    }
    latest(_site: Site): Promise<SourceHealth | null> {
      return Promise.resolve(null);
    }
  }

  @StorePlugin({ id: 'sqlite', description: 'SQLite + Drizzle' })
  @Injectable()
  class SqliteStubStore extends StubJobStore {
    readonly tag = 'sqlite';
  }

  @StorePlugin({ id: 'postgres', description: 'Postgres + Prisma' })
  @Injectable()
  class PostgresStubStore extends StubJobStore {
    readonly tag = 'postgres';
  }

  /** Backend with no @StorePlugin() — used to exercise the upstream
   * configuration check that fails fast before NestJS construction. */
  @Injectable()
  class UndecoratedStubStore extends StubJobStore {
    readonly tag = 'undecorated';
  }

  let testModule: TestingModule | undefined;

  afterEach(async () => {
    if (testModule) {
      await testModule.close();
      testModule = undefined;
    }
  });

  describe('happy path', () => {
    it('binds the chosen backend to JOB_STORE_TOKEN', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory', { backends: [MemoryStubStore] }),
        ],
      }).compile();

      const active = testModule.get<IJobStore>(JOB_STORE_TOKEN);
      expect(active).toBeInstanceOf(MemoryStubStore);
      expect((active as MemoryStubStore).tag).toBe('memory');
    });

    it('binds the same instance to JOB_OBSERVATION_STORE_TOKEN by default', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory', { backends: [MemoryStubStore] }),
        ],
      }).compile();

      const store = testModule.get<IJobStore>(JOB_STORE_TOKEN);
      const obs = testModule.get<IJobObservationStore>(
        JOB_OBSERVATION_STORE_TOKEN,
      );
      // Spec 004 §7: production deployments SHOULD bind both tokens
      // to one provider so a partial outage can't desync canonical
      // rows from observations. Default behaviour aligns with that.
      expect(obs).toBe(store);
    });

    it('makes StoreRegistry injectable alongside the active store', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory', { backends: [MemoryStubStore] }),
        ],
      }).compile();

      const registry = testModule.get(StoreRegistry);
      // Registry sees every declared backend, not just the active one
      // — the future GET /api/storage admin endpoint depends on this.
      expect(registry.listIds()).toEqual(['memory']);
      expect(registry.getMetadata('memory')).toEqual({
        id: 'memory',
        description: 'In-memory store (dev)',
      });
    });
  });

  describe('bindObservationStore: false', () => {
    it('does NOT bind JOB_OBSERVATION_STORE_TOKEN when opted out', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory', {
            backends: [MemoryStubStore],
            bindObservationStore: false,
          }),
        ],
      }).compile();

      // JOB_STORE_TOKEN still resolves; the observation token does not.
      expect(testModule.get<IJobStore>(JOB_STORE_TOKEN)).toBeInstanceOf(
        MemoryStubStore,
      );
      expect(() => testModule!.get(JOB_OBSERVATION_STORE_TOKEN)).toThrow();
    });
  });

  describe('multi-backend selection', () => {
    it('picks the backend whose @StorePlugin id matches storeId', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('postgres', {
            backends: [MemoryStubStore, SqliteStubStore, PostgresStubStore],
          }),
        ],
      }).compile();

      const active = testModule.get<IJobStore>(JOB_STORE_TOKEN);
      expect(active).toBeInstanceOf(PostgresStubStore);
      expect((active as PostgresStubStore).tag).toBe('postgres');

      // Every declared backend is registered (operator can list them),
      // but only the matching one is wired to the token.
      const registry = testModule.get(StoreRegistry);
      expect(registry.listIds()).toEqual(['memory', 'sqlite', 'postgres']);
    });

    it('preserves backend instance identity across multiple injections', async () => {
      // Spec 004 §7 / NFR-3: a single instance per backend keeps
      // memory bounded. Two `@Inject(JOB_STORE_TOKEN)` consumers must
      // see the same object — no transient scope, no factory re-runs.
      @Injectable()
      class ConsumerA {
        constructor(@Inject(JOB_STORE_TOKEN) public readonly store: IJobStore) {}
      }
      @Injectable()
      class ConsumerB {
        constructor(@Inject(JOB_STORE_TOKEN) public readonly store: IJobStore) {}
      }
      @Module({
        imports: [
          StoreModule.forActive('memory', { backends: [MemoryStubStore] }),
        ],
        providers: [ConsumerA, ConsumerB],
      })
      class HarnessModule {}

      testModule = await Test.createTestingModule({
        imports: [HarnessModule],
      }).compile();

      const a = testModule.get(ConsumerA);
      const b = testModule.get(ConsumerB);
      expect(a.store).toBe(b.store);
    });
  });

  describe('global module reach', () => {
    it('makes JOB_STORE_TOKEN injectable from a downstream feature module without re-import', async () => {
      // The dynamic module returns `global: true`, mirroring
      // PluginModule. A feature module that does NOT import
      // StoreModule directly can still inject JOB_STORE_TOKEN.
      @Injectable()
      class JobsService {
        constructor(@Inject(JOB_STORE_TOKEN) public readonly store: IJobStore) {}
      }
      @Module({ providers: [JobsService] })
      class JobsModule {}

      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory', { backends: [MemoryStubStore] }),
          JobsModule,
        ],
      }).compile();

      const jobs = testModule.get(JobsService);
      expect(jobs.store).toBeInstanceOf(MemoryStubStore);
    });
  });

  describe('unknown storeId → ERR_STORE_NOT_FOUND', () => {
    it('propagates the registry error when storeId matches no backend', async () => {
      // The factory bubbles the registry error up to NestJS's bootstrap
      // path. Failing during `.compile()` means an operator with a typo
      // in `EVER_JOBS_STORE` learns about it before the first request.
      let caught: unknown;
      try {
        testModule = await Test.createTestingModule({
          imports: [
            StoreModule.forActive('mongo', { backends: [MemoryStubStore] }),
          ],
        }).compile();
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreRegistryError);
      expect((caught as StoreRegistryError).code).toBe(ERR_STORE_NOT_FOUND);
      // The message names the registered ids so the operator sees what
      // IS available.
      expect((caught as StoreRegistryError).message).toContain('memory');
      expect((caught as StoreRegistryError).message).toContain('mongo');
    });
  });

  describe('empty storeId → ERR_STORE_ACTIVE_ID_REQUIRED', () => {
    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
    ])('rejects %s before NestJS construction', (_label, badId) => {
      // The check runs synchronously in `forActive()` itself, so we
      // don't even get to `Test.createTestingModule`. This catches a
      // common operator typo where `EVER_JOBS_STORE` is set but blank.
      let caught: unknown;
      try {
        StoreModule.forActive(badId, { backends: [MemoryStubStore] });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreModuleConfigurationError);
      expect((caught as StoreModuleConfigurationError).code).toBe(
        ERR_STORE_ACTIVE_ID_REQUIRED,
      );
    });

    it('lists configured backend ids in the error message for triage', () => {
      let caught: unknown;
      try {
        StoreModule.forActive('', {
          backends: [MemoryStubStore, SqliteStubStore],
        });
      } catch (err) {
        caught = err;
      }
      const msg = (caught as StoreModuleConfigurationError).message;
      expect(msg).toContain('memory');
      expect(msg).toContain('sqlite');
    });
  });

  describe('undecorated backend → ERR_STORE_BACKEND_NOT_DECORATED', () => {
    it('rejects classes missing @StorePlugin() before NestJS construction', () => {
      // Same fail-fast rationale as above — discovered as a
      // configuration error rather than a downstream "Cannot read
      // property 'id' of undefined" inside NestJS.
      let caught: unknown;
      try {
        StoreModule.forActive('memory', {
          backends: [MemoryStubStore, UndecoratedStubStore],
        });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreModuleConfigurationError);
      expect((caught as StoreModuleConfigurationError).code).toBe(
        ERR_STORE_BACKEND_NOT_DECORATED,
      );
      expect((caught as StoreModuleConfigurationError).message).toContain(
        'UndecoratedStubStore',
      );
    });
  });

  describe('duplicate id across backends → ERR_STORE_DUPLICATE_ID', () => {
    it('propagates the registry error when two backends declare the same id', async () => {
      // Two distinct classes both decorated with id 'memory' — the
      // registry guard catches them; the factory bubbles the failure
      // up at `.compile()` time.
      @StorePlugin({ id: 'memory', description: 'first' })
      @Injectable()
      class FirstMemory extends StubJobStore {
        readonly tag = 'first';
      }
      @StorePlugin({ id: 'memory', description: 'second' })
      @Injectable()
      class SecondMemory extends StubJobStore {
        readonly tag = 'second';
      }

      let caught: unknown;
      try {
        testModule = await Test.createTestingModule({
          imports: [
            StoreModule.forActive('memory', {
              backends: [FirstMemory, SecondMemory],
            }),
          ],
        }).compile();
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreRegistryError);
      expect((caught as StoreRegistryError).code).toBe(ERR_STORE_DUPLICATE_ID);
    });
  });

  describe('error class identity', () => {
    it('StoreModuleConfigurationError extends Error and exposes .code + .name', () => {
      const e = new StoreModuleConfigurationError('boom', 'ERR_X');
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(StoreModuleConfigurationError);
      expect(e.name).toBe('StoreModuleConfigurationError');
      expect(e.code).toBe('ERR_X');
      expect(e.message).toBe('boom');
    });

    it('error code constants have stable string values', () => {
      // Lock the wire: ops dashboards / log alerts grep these literally.
      expect(ERR_STORE_ACTIVE_ID_REQUIRED).toBe('ERR_STORE_ACTIVE_ID_REQUIRED');
      expect(ERR_STORE_BACKEND_NOT_DECORATED).toBe(
        'ERR_STORE_BACKEND_NOT_DECORATED',
      );
    });
  });

  describe('bindHealthSnapshotStore (Spec 005 / T09 / FR-8)', () => {
    it('binds HEALTH_SNAPSHOT_STORE_TOKEN to the same instance when the active backend implements IHealthSnapshotStore', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory-snap', {
            backends: [SnapshotAwareStubStore],
          }),
        ],
      }).compile();

      const job = testModule.get<IJobStore>(JOB_STORE_TOKEN);
      const snap = testModule.get<IHealthSnapshotStore | null>(
        HEALTH_SNAPSHOT_STORE_TOKEN,
      );
      expect(snap).not.toBeNull();
      // Co-resident binding — the in-memory backend is the documented
      // "single class implements three interfaces" pattern. A separate
      // instance would risk divergence under partial-outage scenarios.
      expect(snap).toBe(job);
    });

    it('binds HEALTH_SNAPSHOT_STORE_TOKEN to null when the active backend does NOT implement IHealthSnapshotStore', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory', { backends: [MemoryStubStore] }),
        ],
      }).compile();

      // The plain MemoryStubStore satisfies IJobStore +
      // IJobObservationStore but NOT IHealthSnapshotStore. The factory
      // hands back `null` so the cron's `@Optional()` consumer sees a
      // sentinel rather than a runtime "missing provider" throw.
      const snap = testModule.get<IHealthSnapshotStore | null>(
        HEALTH_SNAPSHOT_STORE_TOKEN,
      );
      expect(snap).toBeNull();
    });

    it('does NOT register the token at all when bindHealthSnapshotStore: false', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory-snap', {
            backends: [SnapshotAwareStubStore],
            bindHealthSnapshotStore: false,
          }),
        ],
      }).compile();

      // Operators wanting a separate snapshot backend (e.g. canonicals
      // in Postgres, snapshots in Redis) opt out via the flag and bind
      // their own provider — the global module's factory then plays no
      // role at all.
      expect(() => testModule!.get(HEALTH_SNAPSHOT_STORE_TOKEN)).toThrow();
    });

    it('does not break the existing JOB_STORE_TOKEN / JOB_OBSERVATION_STORE_TOKEN bindings', async () => {
      testModule = await Test.createTestingModule({
        imports: [
          StoreModule.forActive('memory-snap', {
            backends: [SnapshotAwareStubStore],
          }),
        ],
      }).compile();

      const job = testModule.get<IJobStore>(JOB_STORE_TOKEN);
      const obs = testModule.get<IJobObservationStore>(
        JOB_OBSERVATION_STORE_TOKEN,
      );
      const snap = testModule.get<IHealthSnapshotStore | null>(
        HEALTH_SNAPSHOT_STORE_TOKEN,
      );
      // All three tokens point at the same backing instance — the
      // co-resident pattern locked in for production deployments.
      expect(obs).toBe(job);
      expect(snap).toBe(job);
    });
  });

  describe('no-backends edge case', () => {
    it('throws ERR_STORE_NOT_FOUND when forActive is given an empty backends list', async () => {
      // Operator calls `forActive('memory')` but forgets to declare
      // any backends. The registry stays empty, so `get('memory')`
      // raises ERR_STORE_NOT_FOUND with a friendly "Registered ids: []"
      // message. This is the exact failure mode T12 (`EVER_JOBS_STORE`
      // honoured at bootstrap) will rely on.
      let caught: unknown;
      try {
        testModule = await Test.createTestingModule({
          imports: [StoreModule.forActive('memory', { backends: [] })],
        }).compile();
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreRegistryError);
      expect((caught as StoreRegistryError).code).toBe(ERR_STORE_NOT_FOUND);
      expect((caught as StoreRegistryError).message).toContain('Registered ids: []');
    });
  });
});
