import {
  CanonicalJob,
  ERR_STORE_BACKEND_DOWN,
  ERR_STORE_INVALID_CURSOR,
  ERR_STORE_NOT_FOUND,
  IJobObservationStore,
  IJobStore,
  IStoreMetadata,
  JOB_OBSERVATION_STORE_TOKEN,
  JOB_STORE_QUERY_DEFAULT_LIMIT,
  JOB_STORE_QUERY_MAX_LIMIT,
  JOB_STORE_TOKEN,
  JobStorePage,
  JobStoreQuery,
  Site,
  SourceObservation,
  STORE_PLUGIN_METADATA_KEY,
} from '@ever-jobs/models';

/**
 * Spec 004 / T01 — interface-shape and constant-value lock-in tests.
 *
 * The interfaces themselves are erased at runtime, so we exercise them
 * via two compile-time-typed stubs that satisfy the contracts. Anything
 * that breaks the public surface (renamed method, dropped param,
 * changed token literal) lights up here before downstream packages fail.
 */
describe('Spec 004 / T01 — store interfaces & constants', () => {
  describe('error codes & DI tokens', () => {
    it('exports the three documented store error codes', () => {
      expect(ERR_STORE_NOT_FOUND).toBe('ERR_STORE_NOT_FOUND');
      expect(ERR_STORE_BACKEND_DOWN).toBe('ERR_STORE_BACKEND_DOWN');
      expect(ERR_STORE_INVALID_CURSOR).toBe('ERR_STORE_INVALID_CURSOR');
    });

    it('exports stable DI tokens for the two stores', () => {
      expect(JOB_STORE_TOKEN).toBe('JOB_STORE');
      expect(JOB_OBSERVATION_STORE_TOKEN).toBe('JOB_OBSERVATION_STORE');
    });

    it('exports the @StorePlugin() metadata key under the ever-jobs namespace', () => {
      expect(STORE_PLUGIN_METADATA_KEY).toBe('ever-jobs:store-plugin');
    });
  });

  describe('JobStoreQuery limits', () => {
    it('defaults to 100 when the caller omits limit', () => {
      expect(JOB_STORE_QUERY_DEFAULT_LIMIT).toBe(100);
    });

    it('caps at 1 000 to bound memory exposure', () => {
      expect(JOB_STORE_QUERY_MAX_LIMIT).toBe(1_000);
    });

    it('default <= max', () => {
      expect(JOB_STORE_QUERY_DEFAULT_LIMIT).toBeLessThanOrEqual(
        JOB_STORE_QUERY_MAX_LIMIT,
      );
    });
  });

  describe('IJobStore method surface', () => {
    const fixture: CanonicalJob = {
      canonicalJobId: 'a'.repeat(64),
      title: 'Engineer',
      company: 'Acme',
      location: 'Remote',
      url: 'https://acme.example.com/jobs/1',
      sources: [],
      fields: {},
      mergedAt: '2026-04-27T10:00:00Z',
    };

    class StubStore implements IJobStore {
      async upsert(job: CanonicalJob): Promise<CanonicalJob> {
        return job;
      }
      async upsertMany(
        jobs: ReadonlyArray<CanonicalJob>,
      ): Promise<{ inserted: number; updated: number }> {
        return { inserted: jobs.length, updated: 0 };
      }
      async getById(_id: string): Promise<CanonicalJob | null> {
        return null;
      }
      async findByCanonicalId(
        _canonicalJobId: string,
      ): Promise<CanonicalJob | null> {
        return null;
      }
      async listByQuery(
        _query: JobStoreQuery,
      ): Promise<JobStorePage<CanonicalJob>> {
        return { items: [] };
      }
      async delete(_id: string): Promise<boolean> {
        return false;
      }
    }

    it('compiles a stub against the interface (compile-time check)', async () => {
      const store: IJobStore = new StubStore();
      await expect(store.upsert(fixture)).resolves.toEqual(fixture);
      await expect(store.upsertMany([fixture])).resolves.toEqual({
        inserted: 1,
        updated: 0,
      });
      await expect(store.getById('x')).resolves.toBeNull();
      await expect(store.findByCanonicalId('x')).resolves.toBeNull();
      await expect(store.listByQuery({})).resolves.toEqual({ items: [] });
      await expect(store.delete('x')).resolves.toBe(false);
    });

    it('listByQuery returns nextCursor as undefined when omitted (NOT null)', async () => {
      const store: IJobStore = new StubStore();
      const page = await store.listByQuery({});
      expect('nextCursor' in page ? page.nextCursor : undefined).toBeUndefined();
    });
  });

  describe('IJobObservationStore method surface', () => {
    const obs: SourceObservation = {
      site: Site.LINKEDIN,
      sourceJobId: 'li-1',
      url: 'https://www.linkedin.com/jobs/view/1',
      observedAt: '2026-04-27T10:00:00Z',
    };

    class StubObsStore implements IJobObservationStore {
      private readonly map = new Map<string, ReadonlyArray<SourceObservation>>();

      async putAll(
        canonicalJobId: string,
        observations: ReadonlyArray<SourceObservation>,
      ): Promise<void> {
        this.map.set(canonicalJobId, observations);
      }
      async listByCanonicalId(
        canonicalJobId: string,
      ): Promise<ReadonlyArray<SourceObservation>> {
        return this.map.get(canonicalJobId) ?? [];
      }
      async deleteByCanonicalId(canonicalJobId: string): Promise<number> {
        const had = this.map.get(canonicalJobId)?.length ?? 0;
        this.map.delete(canonicalJobId);
        return had;
      }
    }

    it('round-trips a putAll → listByCanonicalId → deleteByCanonicalId cycle', async () => {
      const store: IJobObservationStore = new StubObsStore();
      await store.putAll('cid', [obs]);
      await expect(store.listByCanonicalId('cid')).resolves.toEqual([obs]);
      await expect(store.deleteByCanonicalId('cid')).resolves.toBe(1);
      // idempotent — second delete returns 0, never throws.
      await expect(store.deleteByCanonicalId('cid')).resolves.toBe(0);
      await expect(store.listByCanonicalId('cid')).resolves.toEqual([]);
    });
  });

  describe('IStoreMetadata shape', () => {
    it('accepts a minimal id-only descriptor', () => {
      const meta: IStoreMetadata = { id: 'memory' };
      expect(meta.id).toBe('memory');
      expect(meta.description).toBeUndefined();
    });

    it('accepts an id + description descriptor', () => {
      const meta: IStoreMetadata = {
        id: 'postgres',
        description: 'Production-grade Postgres backend (Prisma).',
      };
      expect(meta.id).toBe('postgres');
      expect(meta.description).toBe(
        'Production-grade Postgres backend (Prisma).',
      );
    });
  });
});
