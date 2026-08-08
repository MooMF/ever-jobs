import 'reflect-metadata';
import { ERR_STORE_NOT_FOUND } from '@ever-jobs/models';
import { StoreRegistryError } from '@ever-jobs/plugin';
import { InMemoryJobStore } from '@ever-jobs/store-memory';
import { SqliteDrizzleJobStore } from '@ever-jobs/store-sqlite-drizzle';
import { PostgresPrismaJobStore } from '@ever-jobs/store-postgres-prisma';
import {
  DEFAULT_STORE_ID,
  EVER_JOBS_STORE_ENV_VAR,
  KNOWN_STORE_IDS,
  resolveStoreBootstrap,
} from '../store-bootstrap.factory';

/**
 * Spec 004 / T12 — `EVER_JOBS_STORE` env-var bootstrap factory tests.
 *
 * The factory is the load-bearing piece between operator config and
 * `StoreModule.forActive`. These tests pin:
 *
 *   1. Constants are stable (operators read them from docs / dashboards).
 *   2. Each known id resolves to its `@StorePlugin`-decorated class.
 *   3. Unset / empty / whitespace env-var falls back to
 *      {@link DEFAULT_STORE_ID}.
 *   4. Whitespace around a valid id is trimmed (operator copy-paste UX).
 *   5. Unknown id → `StoreRegistryError` with code
 *      {@link ERR_STORE_NOT_FOUND} and a triage-friendly message.
 *   6. The thrown error message names every known id verbatim
 *      (operator UX: a typo like `postres` immediately suggests
 *      `postgres`).
 *   7. Case-sensitivity: ids are lowercase only — `MEMORY`, `Memory`,
 *      `Postgres` are all rejected (no silent fall-through to the
 *      lowercase version, which would mask a real config drift).
 *   8. Env injection is pure: passing a synthetic `env` does NOT
 *      mutate `process.env`, and `process.env` is the default when
 *      no argument is given.
 *   9. Returned `backendClass` is the concrete `@StorePlugin`-decorated
 *      class (not a wrapper / proxy) — `StoreModule.forActive` reads
 *      the metadata directly from the class identity.
 */
describe('resolveStoreBootstrap (Spec 004 / T12)', () => {
  describe('constants', () => {
    it('exposes the env-var name verbatim for ops dashboards', () => {
      expect(EVER_JOBS_STORE_ENV_VAR).toBe('EVER_JOBS_STORE');
    });

    it('defaults to memory when the env-var is unset', () => {
      expect(DEFAULT_STORE_ID).toBe('memory');
    });

    it('lists exactly the three built-in store ids', () => {
      // Order matters for the error-message contract — the message
      // joins KNOWN_STORE_IDS verbatim, and tests below assert the
      // text contains each id literally.
      expect(KNOWN_STORE_IDS).toEqual(['memory', 'sqlite', 'postgres']);
    });
  });

  describe('happy path — env-var resolves to a known id', () => {
    it.each([
      ['memory', InMemoryJobStore],
      ['sqlite', SqliteDrizzleJobStore],
      ['postgres', PostgresPrismaJobStore],
    ])('resolves EVER_JOBS_STORE=%s to its backend class', (id, cls) => {
      const result = resolveStoreBootstrap({ EVER_JOBS_STORE: id });
      expect(result.id).toBe(id);
      expect(result.backendClass).toBe(cls);
    });

    it('trims surrounding whitespace before lookup (copy-paste UX)', () => {
      // Operators copy-paste env values into Helm charts; trailing
      // whitespace is a common typo that Spec 004 §7.3's "fail fast"
      // rule should NOT punish.
      const result = resolveStoreBootstrap({ EVER_JOBS_STORE: '  sqlite  ' });
      expect(result.id).toBe('sqlite');
      expect(result.backendClass).toBe(SqliteDrizzleJobStore);
    });
  });

  describe('default fallback — env-var unset / empty / whitespace', () => {
    it.each([
      ['undefined', {}],
      ['empty string', { EVER_JOBS_STORE: '' }],
      ['whitespace only', { EVER_JOBS_STORE: '   ' }],
    ])('falls back to memory when env-var is %s', (_label, env) => {
      const result = resolveStoreBootstrap(env);
      expect(result.id).toBe(DEFAULT_STORE_ID);
      expect(result.backendClass).toBe(InMemoryJobStore);
    });
  });

  describe('unknown id → ERR_STORE_NOT_FOUND', () => {
    it('throws StoreRegistryError with the documented code', () => {
      let caught: unknown;
      try {
        resolveStoreBootstrap({ EVER_JOBS_STORE: 'mongo' });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(StoreRegistryError);
      expect((caught as StoreRegistryError).code).toBe(ERR_STORE_NOT_FOUND);
    });

    it('names every known id verbatim in the error message', () => {
      // Operator typo `postres` should immediately suggest `postgres`
      // by literal substring match — not require knowing the registry's
      // listing API.
      let caught: unknown;
      try {
        resolveStoreBootstrap({ EVER_JOBS_STORE: 'postres' });
      } catch (err) {
        caught = err;
      }
      const msg = (caught as StoreRegistryError).message;
      for (const id of KNOWN_STORE_IDS) {
        expect(msg).toContain(id);
      }
      // The bad value also appears in the message so log alerts can
      // grep for the offending input.
      expect(msg).toContain('postres');
      // The fallback hint is included so operators know how to recover.
      expect(msg).toContain(EVER_JOBS_STORE_ENV_VAR);
      expect(msg).toContain(DEFAULT_STORE_ID);
    });

    it.each([
      ['uppercase', 'MEMORY'],
      ['title case', 'Memory'],
      ['mixed case', 'PoStGrEs'],
      ['unrelated', 'mysql'],
      ['typo', 'postres'],
      ['too short', 'mem'],
      ['extra suffix', 'memory-store'],
    ])('rejects %s id (%s)', (_label, badId) => {
      // Case-insensitivity would silently accept `MEMORY` and mask a
      // real config drift (operator thought they set a custom backend
      // but actually got the in-memory one). Reject everything that
      // isn't an exact match.
      expect(() =>
        resolveStoreBootstrap({ EVER_JOBS_STORE: badId }),
      ).toThrow(StoreRegistryError);
    });
  });

  describe('purity — synthetic env does not mutate process.env', () => {
    it('reads from the supplied env map, not process.env', () => {
      const before = process.env[EVER_JOBS_STORE_ENV_VAR];
      const result = resolveStoreBootstrap({ EVER_JOBS_STORE: 'sqlite' });
      const after = process.env[EVER_JOBS_STORE_ENV_VAR];
      expect(result.id).toBe('sqlite');
      expect(after).toBe(before);
    });

    it('uses process.env as default when no env argument is given', () => {
      const original = process.env[EVER_JOBS_STORE_ENV_VAR];
      try {
        // Force a known value into process.env for the duration of
        // this test — restored in `finally` below so other tests
        // remain isolated.
        process.env[EVER_JOBS_STORE_ENV_VAR] = 'memory';
        const result = resolveStoreBootstrap();
        expect(result.id).toBe('memory');
        expect(result.backendClass).toBe(InMemoryJobStore);
      } finally {
        if (original === undefined) {
          delete process.env[EVER_JOBS_STORE_ENV_VAR];
        } else {
          process.env[EVER_JOBS_STORE_ENV_VAR] = original;
        }
      }
    });
  });

  describe('returned class identity', () => {
    it('returns the @StorePlugin-decorated class (not a wrapper)', () => {
      // StoreModule.forActive reads `Reflect.getMetadata(STORE_PLUGIN_METADATA_KEY, cls)`
      // — that lookup only succeeds if `cls` is the exact decorated
      // class. Returning a wrapper / proxy would silently break boot
      // with `ERR_STORE_BACKEND_NOT_DECORATED`.
      const result = resolveStoreBootstrap({ EVER_JOBS_STORE: 'memory' });
      expect(Object.getPrototypeOf(InMemoryJobStore.prototype).constructor).toBe(
        Object.getPrototypeOf(result.backendClass.prototype).constructor,
      );
      expect(result.backendClass.name).toBe(InMemoryJobStore.name);
    });
  });
});
