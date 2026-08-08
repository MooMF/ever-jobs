import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CanonicalJob,
  IJobStore,
  IStoreMetadata,
  JobStorePage,
  JobStoreQuery,
  ERR_STORE_NOT_FOUND,
} from '@ever-jobs/models';
import {
  ERR_STORE_DUPLICATE_ID,
  ERR_STORE_INVALID_ID,
  StoreRegistry,
  StoreRegistryError,
} from '../store-registry.service';

/**
 * Spec 004 / T03 — `StoreRegistry` unit tests.
 *
 * Exercises the registry contract that backs `StoreModule.forActive()`
 * (T04). The registry is the single point where store-id validation
 * happens — the `@StorePlugin()` decorator (T02) intentionally defers
 * all id checks here so that errors surface as structured registry log
 * lines rather than cryptic class-load stack traces. These tests pin:
 *
 *   1. The minimal CRUD surface: register / get / has / listIds /
 *      listMetadata / getMetadata / size / tryGet.
 *   2. id validation (non-empty, kebab-case).
 *   3. Duplicate-id rejection.
 *   4. Error codes (`ERR_STORE_NOT_FOUND` for `get(unknown)`,
 *      `ERR_STORE_INVALID_ID` for bad ids,
 *      `ERR_STORE_DUPLICATE_ID` for collisions).
 *   5. Atomicity — failed registration leaves no orphan entries.
 *   6. Insertion-order iteration (matches `PluginRegistry.listSiteKeys()`).
 *   7. NestJS DI: `StoreRegistry` resolves as a provider.
 */
describe('StoreRegistry (Spec 004 / T03)', () => {
  /** Minimal `IJobStore` stub — every method satisfies the type but
   * none are exercised; the registry only stores the reference. */
  class StubJobStore implements IJobStore {
    constructor(public readonly tag: string) {}

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
  }

  let registry: StoreRegistry;

  beforeEach(() => {
    registry = new StoreRegistry();
  });

  describe('happy path: register / get / has / listIds', () => {
    it('starts empty', () => {
      expect(registry.size).toBe(0);
      expect(registry.listIds()).toEqual([]);
      expect(registry.listMetadata()).toEqual([]);
      expect(registry.has('memory')).toBe(false);
      expect(registry.tryGet('memory')).toBeUndefined();
    });

    it('registers a store with id-only metadata', () => {
      const store = new StubJobStore('memory');
      const metadata: IStoreMetadata = { id: 'memory' };

      registry.register(metadata, store);

      expect(registry.size).toBe(1);
      expect(registry.has('memory')).toBe(true);
      expect(registry.get('memory')).toBe(store);
      expect(registry.tryGet('memory')).toBe(store);
      expect(registry.getMetadata('memory')).toEqual({ id: 'memory' });
      expect(registry.listIds()).toEqual(['memory']);
      expect(registry.listMetadata()).toEqual([{ id: 'memory' }]);
    });

    it('registers a store with id + description', () => {
      const store = new StubJobStore('postgres');
      const metadata: IStoreMetadata = {
        id: 'postgres',
        description: 'Postgres + Prisma (prod)',
      };

      registry.register(metadata, store);

      expect(registry.getMetadata('postgres')).toEqual(metadata);
      expect(registry.get('postgres')).toBe(store);
    });

    it('preserves insertion order across multiple registrations', () => {
      // Insertion order matches PluginRegistry.listSiteKeys() — keep
      // both registries iterating the same way so admin endpoints can
      // share rendering logic without sorting twice.
      registry.register({ id: 'memory' }, new StubJobStore('memory'));
      registry.register({ id: 'sqlite' }, new StubJobStore('sqlite'));
      registry.register({ id: 'postgres' }, new StubJobStore('postgres'));

      expect(registry.listIds()).toEqual(['memory', 'sqlite', 'postgres']);
      expect(registry.listMetadata().map((m) => m.id)).toEqual([
        'memory',
        'sqlite',
        'postgres',
      ]);
      expect(registry.size).toBe(3);
    });
  });

  describe('get(unknown) → ERR_STORE_NOT_FOUND', () => {
    it('throws StoreRegistryError with ERR_STORE_NOT_FOUND code', () => {
      let caught: unknown;
      try {
        registry.get('postgres');
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreRegistryError);
      expect((caught as StoreRegistryError).code).toBe(ERR_STORE_NOT_FOUND);
      expect((caught as StoreRegistryError).message).toContain('postgres');
    });

    it('error message lists currently-registered ids for ops triage', () => {
      registry.register({ id: 'memory' }, new StubJobStore('memory'));
      registry.register({ id: 'sqlite' }, new StubJobStore('sqlite'));

      try {
        registry.get('postgres');
        fail('expected throw');
      } catch (err) {
        const msg = (err as StoreRegistryError).message;
        expect(msg).toContain('memory');
        expect(msg).toContain('sqlite');
      }
    });

    it('tryGet() returns undefined instead of throwing', () => {
      expect(registry.tryGet('unknown')).toBeUndefined();
    });

    it('has() returns false instead of throwing', () => {
      expect(registry.has('unknown')).toBe(false);
    });
  });

  describe('id validation: rejects non-kebab-case', () => {
    /**
     * Each row: [id, label]. The id MUST throw with
     * `ERR_STORE_INVALID_ID`. Catalog covers every realistic
     * malformed-id shape a backend author might try.
     */
    const invalidIds: ReadonlyArray<readonly [unknown, string]> = [
      ['', 'empty string'],
      ['   ', 'whitespace only'],
      ['Postgres', 'uppercase letter'],
      ['POSTGRES', 'all uppercase'],
      ['my_store', 'underscore'],
      ['my store', 'space'],
      ['-postgres', 'leading hyphen'],
      ['postgres-', 'trailing hyphen'],
      ['postgres--db', 'double hyphen'],
      ['2pg', 'leading digit'],
      ['pg!', 'punctuation'],
      ['pg.db', 'dot'],
      ['pg/db', 'slash'],
      [null, 'null'],
      [undefined, 'undefined'],
      [123, 'number'],
      [{ toString: () => 'postgres' }, 'object'],
    ];

    it.each(invalidIds)('rejects id %p (%s)', (id, _label) => {
      let caught: unknown;
      try {
        registry.register(
          { id: id as unknown as string },
          new StubJobStore('x'),
        );
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreRegistryError);
      expect((caught as StoreRegistryError).code).toBe(ERR_STORE_INVALID_ID);
      // Failed registration MUST NOT leave the registry in a partial
      // state — a future register(valid-id) call must succeed and the
      // bad id must NOT be visible via has() / listIds().
      expect(registry.size).toBe(0);
      expect(registry.listIds()).toEqual([]);
    });
  });

  describe('id validation: accepts valid kebab-case', () => {
    const validIds = [
      'memory',
      'sqlite',
      'postgres',
      'a',
      'pg2',
      'store-postgres-prisma',
      'store-sqlite-drizzle',
      'a1-b2-c3',
    ];

    it.each(validIds)('accepts id %p', (id) => {
      registry.register({ id }, new StubJobStore(id));
      expect(registry.has(id)).toBe(true);
      expect(registry.size).toBe(1);
    });
  });

  describe('duplicate id → ERR_STORE_DUPLICATE_ID', () => {
    it('throws on second registration with the same id', () => {
      const first = new StubJobStore('first');
      const second = new StubJobStore('second');
      registry.register({ id: 'memory', description: 'first' }, first);

      let caught: unknown;
      try {
        registry.register({ id: 'memory', description: 'second' }, second);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreRegistryError);
      expect((caught as StoreRegistryError).code).toBe(ERR_STORE_DUPLICATE_ID);
      // Existing registration MUST NOT be overwritten — silent
      // overwrite is the original sin that motivates this whole
      // registry pattern (see Spec 004 §7.3).
      expect(registry.get('memory')).toBe(first);
      expect(registry.getMetadata('memory')?.description).toBe('first');
      expect(registry.size).toBe(1);
    });

    it('error message names the existing description for triage', () => {
      registry.register(
        { id: 'memory', description: 'first description' },
        new StubJobStore('first'),
      );

      try {
        registry.register({ id: 'memory' }, new StubJobStore('second'));
        fail('expected throw');
      } catch (err) {
        expect((err as StoreRegistryError).message).toContain(
          'first description',
        );
      }
    });
  });

  describe('error class identity', () => {
    it('StoreRegistryError extends Error and exposes .code + .name', () => {
      const e = new StoreRegistryError('boom', 'ERR_X');
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(StoreRegistryError);
      expect(e.name).toBe('StoreRegistryError');
      expect(e.code).toBe('ERR_X');
      expect(e.message).toBe('boom');
    });

    it('error code constants have stable string values', () => {
      // Lock the wire: ops dashboards / log alerts grep these literally.
      expect(ERR_STORE_INVALID_ID).toBe('ERR_STORE_INVALID_ID');
      expect(ERR_STORE_DUPLICATE_ID).toBe('ERR_STORE_DUPLICATE_ID');
      expect(ERR_STORE_NOT_FOUND).toBe('ERR_STORE_NOT_FOUND');
    });
  });

  describe('NestJS DI integration', () => {
    let testModule: TestingModule;

    afterEach(async () => {
      if (testModule) await testModule.close();
    });

    it('resolves as a singleton provider', async () => {
      testModule = await Test.createTestingModule({
        providers: [StoreRegistry],
      }).compile();

      const a = testModule.get(StoreRegistry);
      const b = testModule.get(StoreRegistry);
      expect(a).toBe(b);
      expect(a).toBeInstanceOf(StoreRegistry);
      expect(a.size).toBe(0);
    });

    it('survives register → get round trip when resolved through DI', async () => {
      testModule = await Test.createTestingModule({
        providers: [StoreRegistry],
      }).compile();
      const reg = testModule.get(StoreRegistry);
      const store = new StubJobStore('memory');

      reg.register({ id: 'memory' }, store);
      expect(reg.get('memory')).toBe(store);
    });
  });
});
