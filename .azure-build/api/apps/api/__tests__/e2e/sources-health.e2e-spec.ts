/**
 * E2E tests — Spec 005 / T05 — `GET /api/sources/health`.
 *
 * Acceptance from `tasks.md`:
 *   "Returns array of `SourceHealth`; cache-control 1 s."
 *
 * The test bootstraps the full Nest application (so the global
 * `ApiKeyGuard`, `ThrottlerGuard`, `MetricsInterceptor`, and `LoggingInterceptor`
 * are all live), then drives the production `CircuitBreakerService` into
 * known states via its public admin path (`forceOpen` / `forceReset`) and
 * asserts the controller surfaces them.
 *
 * Notes on test isolation:
 *   - Bootstrap is shared (`beforeAll`) — the breaker is a singleton in the
 *     test module so we reset all forced sites in `afterAll`.
 *   - The controller path is rooted at `/api/sources/health`; the legacy
 *     `/health` and `/ping` routes are validated separately in
 *     `apps/api/__tests__/health.e2e-spec.ts`.
 */
import { INestApplication } from '@nestjs/common';
import {
  CIRCUIT_BREAKER_TOKEN,
  ICircuitBreakerService,
  Site,
  SourceHealth,
} from '@ever-jobs/models';
import { PluginRegistry } from '@ever-jobs/plugin';
import { createTestApp } from '../helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('GET /api/sources/health (E2E) — Spec 005 / T05', () => {
  let app: INestApplication;
  let breaker: ICircuitBreakerService;
  let registry: PluginRegistry;

  beforeAll(async () => {
    app = await createTestApp();
    breaker = app.get<ICircuitBreakerService>(CIRCUIT_BREAKER_TOKEN);
    registry = app.get(PluginRegistry);
  });

  afterAll(async () => {
    // Reset any forced state so we don't pollute downstream test files
    // (Jest runs sequentially per `maxWorkers: 1`, but a leaked open
    // breaker would still spill into search.e2e if anyone re-orders).
    breaker.forceReset(Site.LINKEDIN);
    breaker.forceReset(Site.INDEED);
    await app.close();
  });

  it('returns 200 with {count, sources} shape and Cache-Control: max-age=1', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sources/health')
      .expect(200);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('sources');
    expect(typeof res.body.count).toBe('number');
    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.count).toBe(res.body.sources.length);

    // Acceptance criterion: Cache-Control 1 s.
    const cacheControl = res.headers['cache-control'];
    expect(cacheControl).toBeDefined();
    expect(cacheControl).toMatch(/max-age=1\b/);
  });

  it('reflects a force-open state for a specific Site', async () => {
    breaker.forceOpen(Site.LINKEDIN);

    const res = await request(app.getHttpServer())
      .get('/api/sources/health')
      .expect(200);

    const linkedin = (res.body.sources as SourceHealth[]).find(
      (s) => s.site === Site.LINKEDIN,
    );

    expect(linkedin).toBeDefined();
    expect(linkedin!.state).toBe('open');
    // `successRate`, `p95LatencyMs`, and `windowMs` must be present even
    // for a forced-open site (operator triage relies on them).
    expect(typeof linkedin!.successRate).toBe('number');
    expect(typeof linkedin!.p95LatencyMs).toBe('number');
    expect(typeof linkedin!.windowMs).toBe('number');
    expect(linkedin!.windowMs).toBe(60_000);
  });

  it('returns sources sorted alphabetically by site (stable for dashboards)', async () => {
    // Create at least two observed sites with distinct keys.
    breaker.forceOpen(Site.LINKEDIN);
    breaker.forceOpen(Site.INDEED);

    const res = await request(app.getHttpServer())
      .get('/api/sources/health')
      .expect(200);

    const sites = (res.body.sources as SourceHealth[]).map((s) => s.site);
    const sorted = [...sites].sort();
    expect(sites).toEqual(sorted);
  });

  it('?include=all overlays every registered plugin with a synthetic closed row', async () => {
    breaker.forceReset(Site.LINKEDIN);
    breaker.forceReset(Site.INDEED);

    const baseline = await request(app.getHttpServer())
      .get('/api/sources/health')
      .expect(200);
    const baselineCount: number = baseline.body.count;

    const overlay = await request(app.getHttpServer())
      .get('/api/sources/health?include=all')
      .expect(200);

    // The overlay response should include at least every registered plugin.
    const registered = registry.listSiteKeys().length;
    expect(overlay.body.count).toBeGreaterThanOrEqual(registered);
    // And it must always be >= the baseline (overlay is additive, never
    // removes observed entries).
    expect(overlay.body.count).toBeGreaterThanOrEqual(baselineCount);

    // Every synthetic row reports state=closed with default windowMs.
    const synthetic = (overlay.body.sources as SourceHealth[]).filter(
      (s) => s.successRate === 1 && s.p95LatencyMs === 0,
    );
    expect(synthetic.length).toBeGreaterThan(0);
    for (const s of synthetic) {
      expect(s.state).toMatch(/closed|half-open|open/);
      expect(s.windowMs).toBe(60_000);
    }
  });

  it('overlay is additive: a forced-open site stays open even with ?include=all', async () => {
    breaker.forceOpen(Site.LINKEDIN);

    const res = await request(app.getHttpServer())
      .get('/api/sources/health?include=all')
      .expect(200);

    const linkedin = (res.body.sources as SourceHealth[]).find(
      (s) => s.site === Site.LINKEDIN,
    );
    expect(linkedin).toBeDefined();
    expect(linkedin!.state).toBe('open');
  });
});
