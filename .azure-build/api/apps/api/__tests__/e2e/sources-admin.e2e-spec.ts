/**
 * E2E tests — Spec 005 / T07 — `POST /api/sources/:site/circuit/{open,reset}`.
 *
 * Acceptance from `tasks.md`:
 *   "Force-open succeeds with valid API key; 401 otherwise."
 *
 * Q-017 default (Option A) shapes:
 *   - Reflector-driven `@AdminAuth()` decorator + the existing
 *     global `ApiKeyGuard` reads metadata. Admin routes always
 *     require a valid key, even when the global `auth.enabled=false`.
 *   - Misconfigured deploy (no API keys) → 503 Service Unavailable.
 *   - Missing / invalid key on an admin route → 401 Unauthorized.
 *   - Unknown `:site` path param → 404 Not Found.
 *   - Successful action returns 200 + `{ ok, site, health: SourceHealth }`.
 *
 * The test bootstraps the **full** Nest application three times with
 * different `process.env` so the global `ApiKeyGuard` sees each
 * configuration shape. `createTestApp()` re-evaluates the
 * `configuration()` factory on each call, so `process.env.API_KEYS`
 * mutations between bootstraps are picked up.
 */
import { INestApplication } from '@nestjs/common';
import {
  CIRCUIT_BREAKER_TOKEN,
  ICircuitBreakerService,
  Site,
  SourceHealth,
} from '@ever-jobs/models';
import { createTestApp } from '../helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

const TEST_API_KEY = 'test-admin-secret';

describe('POST /api/sources/:site/circuit/{open,reset} (E2E) — Spec 005 / T07', () => {
  // ───────────────────────────────────────────────────────────────────────
  // describe 1 — no API keys configured (deploy is misconfigured)
  // ───────────────────────────────────────────────────────────────────────
  describe('no API_KEYS configured (admin disabled by misconfiguration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      delete process.env.API_KEYS;
      delete process.env.ENABLE_API_KEY_AUTH;
      app = await createTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('responds 503 to force-open without key (admin disabled)', async () => {
      await request(app.getHttpServer())
        .post(`/api/sources/${Site.LINKEDIN}/circuit/open`)
        .expect(503);
    });

    it('responds 503 even when a key is supplied (deploy is misconfigured)', async () => {
      await request(app.getHttpServer())
        .post(`/api/sources/${Site.LINKEDIN}/circuit/open`)
        .set('x-api-key', 'anything')
        .expect(503);
    });

    it('GET /api/sources/health still works (standard route, no auth)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sources/health')
        .expect(200);
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('sources');
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // describe 2 — keys configured; ENABLE_API_KEY_AUTH=false
  //   (admin routes still require a key; standard routes do not)
  // ───────────────────────────────────────────────────────────────────────
  describe('API_KEYS configured, ENABLE_API_KEY_AUTH=false', () => {
    let app: INestApplication;
    let breaker: ICircuitBreakerService;

    beforeAll(async () => {
      process.env.API_KEYS = TEST_API_KEY;
      process.env.ENABLE_API_KEY_AUTH = 'false';
      app = await createTestApp();
      breaker = app.get<ICircuitBreakerService>(CIRCUIT_BREAKER_TOKEN);
    });

    afterAll(async () => {
      breaker.forceReset(Site.LINKEDIN);
      breaker.forceReset(Site.INDEED);
      delete process.env.API_KEYS;
      delete process.env.ENABLE_API_KEY_AUTH;
      await app.close();
    });

    it('GET /api/sources/health is reachable without key (standard route)', async () => {
      await request(app.getHttpServer())
        .get('/api/sources/health')
        .expect(200);
    });

    it('returns 401 on force-open without API key', async () => {
      await request(app.getHttpServer())
        .post(`/api/sources/${Site.LINKEDIN}/circuit/open`)
        .expect(401);
    });

    it('returns 401 on force-open with INVALID API key', async () => {
      await request(app.getHttpServer())
        .post(`/api/sources/${Site.LINKEDIN}/circuit/open`)
        .set('x-api-key', 'wrong-key')
        .expect(401);
    });

    it('returns 200 on force-open with valid API key and opens the breaker', async () => {
      // Sanity: state is closed before the call.
      expect(breaker.state(Site.LINKEDIN)).toBe('closed');

      const res = await request(app.getHttpServer())
        .post(`/api/sources/${Site.LINKEDIN}/circuit/open`)
        .set('x-api-key', TEST_API_KEY)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.site).toBe(Site.LINKEDIN);
      const health: SourceHealth = res.body.health;
      expect(health.state).toBe('open');
      expect(health.site).toBe(Site.LINKEDIN);
      // Breaker state itself flipped (action persisted server-side).
      expect(breaker.state(Site.LINKEDIN)).toBe('open');
    });

    it('returns 200 on force-reset with valid API key and closes the breaker', async () => {
      breaker.forceOpen(Site.INDEED);
      expect(breaker.state(Site.INDEED)).toBe('open');

      const res = await request(app.getHttpServer())
        .post(`/api/sources/${Site.INDEED}/circuit/reset`)
        .set('x-api-key', TEST_API_KEY)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.site).toBe(Site.INDEED);
      const health: SourceHealth = res.body.health;
      expect(health.state).toBe('closed');
      expect(breaker.state(Site.INDEED)).toBe('closed');
    });

    it('returns 404 for an unknown :site even with valid API key', async () => {
      await request(app.getHttpServer())
        .post('/api/sources/not-a-real-source/circuit/open')
        .set('x-api-key', TEST_API_KEY)
        .expect(404);
    });

    it('returns 404 for unknown :site on /circuit/reset too', async () => {
      await request(app.getHttpServer())
        .post('/api/sources/not-a-real-source/circuit/reset')
        .set('x-api-key', TEST_API_KEY)
        .expect(404);
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // describe 3 — keys configured AND ENABLE_API_KEY_AUTH=true
  //   (standard routes also require a key; admin routes still 401 on bad key)
  // ───────────────────────────────────────────────────────────────────────
  describe('API_KEYS configured, ENABLE_API_KEY_AUTH=true', () => {
    let app: INestApplication;

    beforeAll(async () => {
      process.env.API_KEYS = TEST_API_KEY;
      process.env.ENABLE_API_KEY_AUTH = 'true';
      app = await createTestApp();
    });

    afterAll(async () => {
      delete process.env.API_KEYS;
      delete process.env.ENABLE_API_KEY_AUTH;
      await app.close();
    });

    it('standard route now requires a key (returns 403 without key)', async () => {
      await request(app.getHttpServer())
        .get('/api/sources/health')
        .expect(403);
    });

    it('admin route returns 401 (NOT 403) on missing key — distinct contract from standard', async () => {
      await request(app.getHttpServer())
        .post(`/api/sources/${Site.LINKEDIN}/circuit/open`)
        .expect(401);
    });

    it('valid key works on admin route', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/sources/${Site.LINKEDIN}/circuit/reset`)
        .set('x-api-key', TEST_API_KEY)
        .expect(200);
      expect(res.body.ok).toBe(true);
    });
  });
});
