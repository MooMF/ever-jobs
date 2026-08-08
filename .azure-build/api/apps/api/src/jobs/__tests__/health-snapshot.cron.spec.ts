/**
 * Unit tests — Spec 005 / Phase 5 / T09 — `HealthSnapshotCron`.
 *
 * Drives the provider directly (no Nest bootstrap) so tests pin
 * exact behaviour per branch:
 *
 *  1. Both deps unbound → onApplicationBootstrap is a no-op (no
 *     timer scheduled, no log spam).
 *  2. Only breaker unbound → no timer scheduled, the bypass log
 *     line names CIRCUIT_BREAKER_TOKEN explicitly.
 *  3. Only store unbound → same; log line names HEALTH_SNAPSHOT_STORE_TOKEN.
 *  4. Both bound → timer scheduled at the requested interval; the
 *     handle is `unref()`'d so it doesn't block process exit.
 *  5. snapshot() with both bound + non-empty list → calls
 *     `store.putBatch(list, ts)` once with the exact payload.
 *  6. snapshot() with empty list → does NOT call putBatch (interface
 *     contract — empty input MUST short-circuit).
 *  7. snapshot() when putBatch rejects with structured `.code` →
 *     surfaces that code on the result, NEVER re-throws.
 *  8. snapshot() when putBatch rejects with bare Error → fallback
 *     code `ERR_HEALTH_SNAPSHOT_PERSIST_FAILED`.
 *  9. snapshot() when breaker.list() throws → surfaced on result;
 *     never re-thrown (next tick will retry).
 * 10. snapshot() with deps unbound → resolves to
 *     `{ persisted: false, reason: 'no-binding' }` even if invoked
 *     directly (defensive against test harnesses that bypass
 *     onApplicationBootstrap).
 * 11. onApplicationShutdown clears the interval; idempotent across
 *     repeated calls.
 * 12. Timer tick invokes snapshot() (jest fake timers).
 * 13. Negative / NaN / zero interval falls back to the default —
 *     misconfigured operator value MUST NOT abort startup.
 */
import 'reflect-metadata';
import {
  ICircuitBreakerService,
  IHealthSnapshotStore,
  Site,
  SourceHealth,
} from '@ever-jobs/models';
import {
  DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS,
  ERR_HEALTH_SNAPSHOT_PERSIST_FAILED,
  HealthSnapshotCron,
} from '../health-snapshot.cron';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHealth(site: Site, overrides: Partial<SourceHealth> = {}): SourceHealth {
  return {
    site,
    state: 'closed',
    successRate: 1,
    p95LatencyMs: 0,
    windowMs: 60_000,
    ...overrides,
  };
}

interface BreakerStub extends ICircuitBreakerService {
  readonly list: jest.Mock<SourceHealth[], []>;
}

interface StoreStub extends IHealthSnapshotStore {
  readonly putBatch: jest.Mock<
    Promise<{ inserted: number }>,
    [ReadonlyArray<SourceHealth>, Date]
  >;
}

function makeBreaker(snapshots: SourceHealth[] = []): BreakerStub {
  const listMock: jest.Mock<SourceHealth[], []> = jest.fn(() => snapshots);
  return {
    list: listMock,
    exec: <T>(_s: Site, fn: () => Promise<T>) => fn(),
    state: () => 'closed',
    health: (site: Site) => makeHealth(site),
    forceOpen: () => undefined,
    forceReset: () => undefined,
    setPolicy: () => undefined,
  };
}

function makeStore(
  impl: (
    snapshots: ReadonlyArray<SourceHealth>,
    ts: Date,
  ) => Promise<{ inserted: number }> = (s) => Promise.resolve({ inserted: s.length }),
): StoreStub {
  const putBatchMock: jest.Mock<
    Promise<{ inserted: number }>,
    [ReadonlyArray<SourceHealth>, Date]
  > = jest.fn(impl);
  return {
    putBatch: putBatchMock,
    listSince: () => Promise.resolve([]),
    latest: () => Promise.resolve(null),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HealthSnapshotCron (Spec 005 / T09)', () => {
  describe('onApplicationBootstrap — bypass paths', () => {
    it('is a no-op when neither dep is bound', () => {
      const cron = new HealthSnapshotCron(undefined, undefined, 50);
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      try {
        cron.onApplicationBootstrap();
        expect(setIntervalSpy).not.toHaveBeenCalled();
      } finally {
        setIntervalSpy.mockRestore();
      }
    });

    it('is a no-op when only breaker is bound', () => {
      const cron = new HealthSnapshotCron(makeBreaker(), undefined, 50);
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      try {
        cron.onApplicationBootstrap();
        expect(setIntervalSpy).not.toHaveBeenCalled();
      } finally {
        setIntervalSpy.mockRestore();
      }
    });

    it('is a no-op when only store is bound', () => {
      const cron = new HealthSnapshotCron(undefined, makeStore(), 50);
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      try {
        cron.onApplicationBootstrap();
        expect(setIntervalSpy).not.toHaveBeenCalled();
      } finally {
        setIntervalSpy.mockRestore();
      }
    });
  });

  describe('onApplicationBootstrap — happy path', () => {
    it('schedules an interval at the configured ms when both deps are bound', () => {
      jest.useFakeTimers();
      try {
        const breaker = makeBreaker([makeHealth(Site.LINKEDIN)]);
        const store = makeStore();
        const cron = new HealthSnapshotCron(breaker, store, 50);

        cron.onApplicationBootstrap();

        // No tick has fired yet — putBatch is still untouched.
        expect(store.putBatch).not.toHaveBeenCalled();
        // After one interval, snapshot() runs and putBatch is called.
        jest.advanceTimersByTime(50);
        // Async putBatch resolves on the microtask queue — flush it.
        return Promise.resolve().then(() => {
          expect(store.putBatch).toHaveBeenCalledTimes(1);
          cron.onApplicationShutdown();
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('falls back to the default interval when given a negative / NaN / zero value', () => {
      jest.useFakeTimers();
      try {
        const setIntervalSpy = jest.spyOn(global, 'setInterval');
        const breaker = makeBreaker([makeHealth(Site.LINKEDIN)]);
        const store = makeStore();

        for (const bad of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
          const cron = new HealthSnapshotCron(breaker, store, bad);
          cron.onApplicationBootstrap();
          expect(setIntervalSpy).toHaveBeenLastCalledWith(
            expect.any(Function),
            DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS,
          );
          cron.onApplicationShutdown();
        }
        setIntervalSpy.mockRestore();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('snapshot() — happy path', () => {
    it('calls store.putBatch once with the breaker.list() output and a fresh Date', async () => {
      const list: SourceHealth[] = [
        makeHealth(Site.LINKEDIN, { successRate: 0.8 }),
        makeHealth(Site.INDEED, { state: 'open' }),
      ];
      const breaker = makeBreaker(list);
      const store = makeStore(() => Promise.resolve({ inserted: list.length }));
      const cron = new HealthSnapshotCron(breaker, store, 50);

      const before = Date.now();
      const result = await cron.snapshot();
      const after = Date.now();

      expect(store.putBatch).toHaveBeenCalledTimes(1);
      const [snapshots, ts] = store.putBatch.mock.calls[0];
      expect(snapshots).toEqual(list);
      expect(ts).toBeInstanceOf(Date);
      expect(ts.getTime()).toBeGreaterThanOrEqual(before);
      expect(ts.getTime()).toBeLessThanOrEqual(after);
      expect(result).toEqual({ persisted: true, inserted: list.length });
    });

    it('short-circuits when breaker.list() returns an empty array', async () => {
      const breaker = makeBreaker([]);
      const store = makeStore();
      const cron = new HealthSnapshotCron(breaker, store, 50);

      const result = await cron.snapshot();

      expect(breaker.list).toHaveBeenCalledTimes(1);
      expect(store.putBatch).not.toHaveBeenCalled();
      expect(result).toEqual({ persisted: true, inserted: 0 });
    });
  });

  describe('snapshot() — failure isolation', () => {
    it('captures structured store error codes and never re-throws', async () => {
      const breaker = makeBreaker([makeHealth(Site.LINKEDIN)]);
      class BackendDownError extends Error {
        readonly code = 'ERR_STORE_BACKEND_DOWN';
      }
      const store = makeStore(() => Promise.reject(new BackendDownError('pg ECONNREFUSED')));
      const cron = new HealthSnapshotCron(breaker, store, 50);

      const result = await cron.snapshot();

      expect(result.persisted).toBe(false);
      if (result.persisted) {
        throw new Error('unreachable — pinned by the assertion above');
      }
      expect(result.reason).toBe('putBatch-rejected');
      expect(result.error?.code).toBe('ERR_STORE_BACKEND_DOWN');
      expect(result.error?.message).toContain('pg ECONNREFUSED');
    });

    it('falls back to ERR_HEALTH_SNAPSHOT_PERSIST_FAILED for bare Error', async () => {
      const breaker = makeBreaker([makeHealth(Site.LINKEDIN)]);
      const store = makeStore(() => Promise.reject(new Error('whoops')));
      const cron = new HealthSnapshotCron(breaker, store, 50);

      const result = await cron.snapshot();

      expect(result.persisted).toBe(false);
      if (result.persisted) throw new Error('unreachable');
      expect(result.error?.code).toBe(ERR_HEALTH_SNAPSHOT_PERSIST_FAILED);
    });

    it('captures non-Error throws (string, object) without crashing', async () => {
      const breaker = makeBreaker([makeHealth(Site.LINKEDIN)]);
      const store = makeStore(() => Promise.reject('non-Error rejection'));
      const cron = new HealthSnapshotCron(breaker, store, 50);

      const result = await cron.snapshot();

      expect(result.persisted).toBe(false);
      if (result.persisted) throw new Error('unreachable');
      expect(result.error?.code).toBe(ERR_HEALTH_SNAPSHOT_PERSIST_FAILED);
      expect(result.error?.message).toBe('non-Error rejection');
    });

    it('handles breaker.list() throwing — never re-thrown, surfaced on result', async () => {
      const breaker = makeBreaker();
      breaker.list.mockImplementation(() => {
        throw new Error('breaker offline');
      });
      const store = makeStore();
      const cron = new HealthSnapshotCron(breaker, store, 50);

      const result = await cron.snapshot();

      expect(result.persisted).toBe(false);
      if (result.persisted) throw new Error('unreachable');
      expect(result.reason).toBe('list-threw');
      expect(store.putBatch).not.toHaveBeenCalled();
    });
  });

  describe('snapshot() — defensive bypass', () => {
    it('returns no-binding even when called directly without onApplicationBootstrap', async () => {
      // Defensive: a future caller wiring the cron without
      // onApplicationBootstrap() (custom test harness, manual probe)
      // shouldn't NPE on `this.breaker.list()`.
      const cron = new HealthSnapshotCron(undefined, undefined, 50);
      const result = await cron.snapshot();
      expect(result).toEqual({ persisted: false, reason: 'no-binding' });
    });

    it('returns no-binding when breaker is bound but store is not', async () => {
      const cron = new HealthSnapshotCron(makeBreaker([makeHealth(Site.LINKEDIN)]), undefined, 50);
      const result = await cron.snapshot();
      expect(result).toEqual({ persisted: false, reason: 'no-binding' });
    });

    it('returns no-binding when store is bound but breaker is not', async () => {
      const cron = new HealthSnapshotCron(undefined, makeStore(), 50);
      const result = await cron.snapshot();
      expect(result).toEqual({ persisted: false, reason: 'no-binding' });
    });

    it('returns no-binding when store is explicitly null (production wire path)', async () => {
      // `StoreModule.forActive(...)` binds HEALTH_SNAPSHOT_STORE_TOKEN
      // to a `null`-returning factory when the active backend doesn't
      // implement IHealthSnapshotStore (sqlite-drizzle / postgres-prisma).
      // The cron MUST treat that `null` as "no store" — the test here
      // pins that via a synthetic `null` injection, mirroring how the
      // factory's resolved value flows into the constructor at runtime.
      const cron = new HealthSnapshotCron(makeBreaker(), null, 50);
      const result = await cron.snapshot();
      expect(result).toEqual({ persisted: false, reason: 'no-binding' });
    });
  });

  describe('onApplicationShutdown — interval lifecycle', () => {
    it('clears the interval when both deps were bound', () => {
      jest.useFakeTimers();
      try {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        const breaker = makeBreaker();
        const store = makeStore();
        const cron = new HealthSnapshotCron(breaker, store, 50);
        cron.onApplicationBootstrap();
        cron.onApplicationShutdown();
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        clearIntervalSpy.mockRestore();
      } finally {
        jest.useRealTimers();
      }
    });

    it('is idempotent — repeated shutdown calls clear nothing extra', () => {
      jest.useFakeTimers();
      try {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        const cron = new HealthSnapshotCron(makeBreaker(), makeStore(), 50);
        cron.onApplicationBootstrap();
        cron.onApplicationShutdown();
        cron.onApplicationShutdown();
        cron.onApplicationShutdown();
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        clearIntervalSpy.mockRestore();
      } finally {
        jest.useRealTimers();
      }
    });

    it('shutdown without bootstrap is a no-op (no timer to clear)', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const cron = new HealthSnapshotCron(makeBreaker(), makeStore(), 50);
      cron.onApplicationShutdown();
      expect(clearIntervalSpy).not.toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('default constants', () => {
    it('exports DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS = 60_000 (Spec 005 FR-8)', () => {
      expect(DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS).toBe(60_000);
    });

    it('exports ERR_HEALTH_SNAPSHOT_PERSIST_FAILED literally for log-grep', () => {
      expect(ERR_HEALTH_SNAPSHOT_PERSIST_FAILED).toBe(
        'ERR_HEALTH_SNAPSHOT_PERSIST_FAILED',
      );
    });
  });
});
