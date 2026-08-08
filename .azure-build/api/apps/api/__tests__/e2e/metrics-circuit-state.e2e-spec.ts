/**
 * E2E tests — Spec 005 / T06 — `source_circuit_state` exposed under `/metrics`.
 *
 * Acceptance from `tasks.md`:
 *   "`curl /metrics` includes `source_circuit_state{site=...}`."
 *
 * The test bootstraps the full Nest application so the
 * `MetricsCircuitBreakerBridge` runs at `OnApplicationBootstrap` and
 * binds the live `CircuitBreakerService` into the Gauge's `collect()`
 * callback. We then drive the breaker into known states via its public
 * admin path (`forceOpen` / `forceReset`) and assert the Prometheus
 * exposition surfaces them.
 *
 * Q-015 / Option A — encoding `closed=0, half-open=1, open=2`.
 */
import { INestApplication } from '@nestjs/common';
import {
  CIRCUIT_BREAKER_TOKEN,
  ICircuitBreakerService,
  Site,
} from '@ever-jobs/models';
import { createTestApp } from '../helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('GET /metrics — source_circuit_state (E2E) — Spec 005 / T06', () => {
  let app: INestApplication;
  let breaker: ICircuitBreakerService;

  beforeAll(async () => {
    app = await createTestApp();
    breaker = app.get<ICircuitBreakerService>(CIRCUIT_BREAKER_TOKEN);
  });

  afterAll(async () => {
    // Reset any forced state so the breaker doesn't leak into later
    // suites (e.g. `sources-health.e2e-spec.ts`).
    breaker.forceReset(Site.LINKEDIN);
    breaker.forceReset(Site.INDEED);
    await app.close();
  });

  it('exposes the Gauge metadata even before any breaker activity', async () => {
    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    // Metadata is always emitted because the Gauge is registered;
    // sample lines may or may not be present depending on whether any
    // site has been observed yet.
    expect(res.text).toContain('# TYPE ever_jobs_source_circuit_state gauge');
    expect(res.text).toContain(
      'Per-source circuit-breaker state (closed=0, half-open=1, open=2)',
    );
  });

  it('reflects a force-open state as the value 2 with the matching {site} label', async () => {
    breaker.forceOpen(Site.LINKEDIN);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);

    // The acceptance line: `source_circuit_state{site="linkedin"} 2`.
    expect(res.text).toMatch(
      /ever_jobs_source_circuit_state\{site="linkedin"\} 2\b/,
    );
  });

  it('reflects a force-reset (closed) state as the value 0', async () => {
    breaker.forceOpen(Site.INDEED);
    // First scrape — INDEED is open.
    const opened = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);
    expect(opened.text).toMatch(
      /ever_jobs_source_circuit_state\{site="indeed"\} 2\b/,
    );

    breaker.forceReset(Site.INDEED);

    const closed = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);
    expect(closed.text).toMatch(
      /ever_jobs_source_circuit_state\{site="indeed"\} 0\b/,
    );
  });

  it('emits one sample line per observed Site (cardinality matches breaker.list().length)', async () => {
    breaker.forceOpen(Site.LINKEDIN);
    breaker.forceOpen(Site.INDEED);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);

    const sampleLines = res.text
      .split('\n')
      .filter(
        (l: string) =>
          l.startsWith('ever_jobs_source_circuit_state') && l.includes('{'),
      );

    // At least the two we forced; could be more if upstream tests
    // observed additional sites. The contract is "no fewer than the
    // observed set, one line per site".
    const observedSites = breaker.list().map((h) => h.site);
    expect(sampleLines.length).toBe(observedSites.length);

    for (const site of observedSites) {
      const match = sampleLines.find((l: string) =>
        l.includes(`{site="${site}"}`),
      );
      expect(match).toBeDefined();
    }
  });
});
