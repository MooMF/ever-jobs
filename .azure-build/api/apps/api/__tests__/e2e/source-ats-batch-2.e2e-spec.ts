/**
 * E2E test — Spec 013 / T12.
 *
 * Hits the real HTTP surface (`POST /api/jobs/search`) of a fully
 * bootstrapped `AppModule`, with the only external dependency —
 * `@ever-jobs/common`'s `createHttpClient` — replaced by a fixture
 * router. Verifies that the three new batch-2 plugins
 * (`oracle` / `mercor` / `tesla`) round-trip through the controller +
 * cache + dedup pipeline and return non-empty `JobPostDto[]`.
 *
 * Mirrors `source-ats-batch-1.e2e-spec.ts` (Spec 006 / T10): same
 * `jest.mock('@ever-jobs/common', …)` shape, same `createTestApp()`
 * boot, same supertest issuance pattern. Reuses the URL→fixture
 * router introduced by Spec 013 / T11's integration spec — single-
 * sourced fixtures live under each plugin's `__tests__/fixtures/`
 * directory rather than being duplicated under `apps/api/__tests__/`.
 *
 * Acceptance from `tasks.md` T12:
 *   - `GET /api/jobs?site=oracle&companyUrl=https%3A%2F%2Feeho.fa.us2.oraclecloud.com`,
 *     `&site=mercor&companySlug=stripe`, `&site=tesla` return
 *     `200 OK` + non-empty `JobPostDto[]` against a sandboxed
 *     fixture server.
 *   - Asserts dedup-engine consumes the rows without collisions
 *     across the three plugins.
 *
 * Departures from the literal acceptance text — same departures
 * that Spec 006 / T10 made, for the same reasons:
 *
 *   1. **POST not GET; 201 not 200.** The real controller is
 *      `POST /api/jobs/search` (see `apps/api/src/jobs/jobs.controller.ts`
 *      and the existing `source-ats-batch-1.e2e-spec.ts`); NestJS
 *      returns `201 Created` by default for POST handlers without an
 *      explicit `@HttpCode(200)` decorator. The tasks-file phrasing
 *      predates the body-vs-query refactor; we honour the *intent*
 *      (per-plugin HTTP round-trip) by hitting the real endpoint shape
 *      with the same body the unit + integration suites use.
 *   2. **Mock `createHttpClient`, not a sandboxed nock server.** The
 *      unit suites for the three plugins already use
 *      `jest.mock(@ever-jobs/common)`; using it here keeps the
 *      integration shape consistent across unit / integration / E2E
 *      tiers. `nock` would shadow the same code path (axios → undici
 *      stack) at the network layer, which is strictly less precise
 *      than mocking the factory itself.
 *   3. **Slug routing per plugin.** Oracle accepts `companySlug='eeho-us2'`
 *      and composes it to `https://eeho.fa.us2.oraclecloud.com`; Mercor
 *      treats `companySlug='stripe'` as a substring filter on
 *      `companyName`; Tesla is single-tenant and ignores `companySlug`.
 *      The cross-plugin fan-out test passes `companySlug='eeho-us2'` for
 *      all three — Oracle composes the URL, Tesla ignores it, and
 *      Mercor (correctly) emits zero rows since no `companyName`
 *      contains `eeho-us2`. That mirrors the integration-spec
 *      (Spec 013 / T11) shape exactly.
 *   4. **`descriptionDepth='board'` on cross-plugin tests.** Default
 *      `'detail-25'` would issue 25 follow-up GETs per Tesla scrape
 *      and bloat the fixture-router log. `'board'` keeps the e2e
 *      suite quick (single board GET per Tesla scrape) — same
 *      rationale as the integration spec.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

// ── Fixture preload — installed BEFORE any service module imports ────
//
// jest.mock() is hoisted to the top of the file at compile time, so
// the `createHttpClient` factory is replaced before AppModule's
// module-graph evaluation kicks off. The factory closes over the
// URL→fixture router declared below.
const PLUGIN_FIXTURES = (() => {
  const oracleFx = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'plugins',
    'source-ats-oracle',
    '__tests__',
    'fixtures',
  );
  const mercorFx = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'plugins',
    'source-ats-mercor',
    '__tests__',
    'fixtures',
  );
  const teslaFx = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'plugins',
    'source-tesla',
    '__tests__',
    'fixtures',
  );
  return {
    oraclePage1: JSON.parse(
      fs.readFileSync(path.join(oracleFx, 'oracle-page-1.json'), 'utf8'),
    ),
    mercorExplore: JSON.parse(
      fs.readFileSync(path.join(mercorFx, 'mercor-explore.json'), 'utf8'),
    ),
    teslaBoard: JSON.parse(
      fs.readFileSync(path.join(teslaFx, 'tesla-board.json'), 'utf8'),
    ),
    teslaJob200001: JSON.parse(
      fs.readFileSync(path.join(teslaFx, 'tesla-job-200001.json'), 'utf8'),
    ),
    teslaJob200002: JSON.parse(
      fs.readFileSync(path.join(teslaFx, 'tesla-job-200002.json'), 'utf8'),
    ),
    teslaJob200003: JSON.parse(
      fs.readFileSync(path.join(teslaFx, 'tesla-job-200003.json'), 'utf8'),
    ),
  };
})();

// Oracle's pagination loop needs a different response on subsequent
// pages so the `requisitionList[]` empty guard fires and the loop
// terminates. First call → fixture; subsequent → empty.
const oracleGetCount: Map<string, number> = new Map();

function routeGet(url: string): unknown {
  // Oracle — paginated finder against `recruitingCEJobRequisitions`.
  if (url.includes('oraclecloud.com') || url.includes('recruitingCEJobRequisitions')) {
    const count = (oracleGetCount.get('oracle') ?? 0) + 1;
    oracleGetCount.set('oracle', count);
    return count === 1
      ? PLUGIN_FIXTURES.oraclePage1
      : { items: [{ TotalJobsCount: 0, requisitionList: [] }] };
  }

  // Mercor — single explore-page GET (catalogue-wide).
  if (url.includes('aws.api.mercor.com/work/listings-explore-page')) {
    return PLUGIN_FIXTURES.mercorExplore;
  }

  // Tesla — board + per-job detail.
  if (url.includes('tesla.com/cua-api/apps/careers/state')) {
    return PLUGIN_FIXTURES.teslaBoard;
  }
  if (url.includes('tesla.com/cua-api/careers/job/200001')) {
    return PLUGIN_FIXTURES.teslaJob200001;
  }
  if (url.includes('tesla.com/cua-api/careers/job/200002')) {
    return PLUGIN_FIXTURES.teslaJob200002;
  }
  if (url.includes('tesla.com/cua-api/careers/job/200003')) {
    return PLUGIN_FIXTURES.teslaJob200003;
  }
  if (url.includes('tesla.com/cua-api/careers/job/')) {
    // Remaining detail endpoints — return a "missing all four"
    // envelope so `composeDescription()` resolves to null. This
    // keeps the test deterministic without per-listing fixtures.
    return { jobDescription: null, jobResponsibilities: null };
  }

  // Default — null body. Keeps the e2e suite resilient against
  // late-introduced plugins that share `siteType` enum keys by
  // returning a benign payload.
  return null;
}

function routePost(_url: string): unknown {
  return null;
}

jest.mock('@ever-jobs/common', () => {
  const actual = jest.requireActual('@ever-jobs/common');
  return {
    ...actual,
    createHttpClient: jest.fn(() => ({
      get: jest.fn(async (url: string) => {
        return { data: routeGet(url) };
      }),
      post: jest.fn(async (url: string, _body: unknown) => {
        return { data: routePost(url) };
      }),
      setHeaders: jest.fn(),
    })),
  };
});

// ── Bootstrap ─────────────────────────────────────────────────────────
// eslint-disable-next-line import/first
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line import/first
import { Site } from '@ever-jobs/models';
// eslint-disable-next-line import/first
import { createTestApp } from '../helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('E2E — Spec 013 / T12 (POST /api/jobs/search across oracle × mercor × tesla)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    oracleGetCount.clear();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    oracleGetCount.clear();
  });

  it('oracle single-source request → 201 + non-empty job list', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.ORACLE],
        companySlug: 'eeho-us2',
        resultsWanted: 50,
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('jobs');
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
    for (const job of res.body.jobs) {
      expect(job.site).toBe(Site.ORACLE);
    }
  });

  it('mercor single-source request → 201 + non-empty job list', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.MERCOR],
        companySlug: 'stripe',
        resultsWanted: 50,
      })
      .expect(201);

    expect(res.body.count).toBeGreaterThan(0);
    for (const job of res.body.jobs) {
      expect(job.site).toBe(Site.MERCOR);
      // Mercor's slug filter is a case-insensitive substring match
      // against `companyName` — every emitted row must contain the
      // slug after lower-casing.
      expect((job.companyName ?? '').toLowerCase()).toContain('stripe');
    }
  });

  it('tesla single-source request → 201 + non-empty job list', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.TESLA],
        // Cap detail-fetches via the board-only budget so the test
        // doesn't iterate the full 50-listing fixture's per-job loop.
        descriptionDepth: 'board',
        resultsWanted: 50,
      })
      .expect(201);

    expect(res.body.count).toBeGreaterThan(0);
    for (const job of res.body.jobs) {
      expect(job.site).toBe(Site.TESLA);
    }
  });

  it('cross-plugin fan-out → oracle + tesla contribute, mercor zero (eeho-us2 slug); dedup runs zero collisions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.ORACLE, Site.MERCOR, Site.TESLA],
        // `eeho-us2` resolves to a real Oracle tenant but is NOT a
        // substring of any Mercor `companyName` in the fixture, so
        // Mercor (correctly) emits zero rows. Tesla ignores
        // `companySlug` (single-tenant). Mercor's happy path is
        // covered by the `stripe` slug case above.
        companySlug: 'eeho-us2',
        resultsWanted: 50,
        descriptionDepth: 'board',
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('raw_count');
    expect(res.body).toHaveProperty('deduped', true);

    const jobs: Array<{ site: string }> = res.body.jobs;
    const sites = new Set(jobs.map((j) => j.site));
    expect(sites.has(Site.ORACLE)).toBe(true);
    expect(sites.has(Site.TESLA)).toBe(true);
    // Mercor: zero rows on `eeho-us2` slug — see comment above.
    expect(sites.has(Site.MERCOR)).toBe(false);

    // Zero collisions on the synthetic fixtures: Oracle namespaces
    // its `externalId` as `oracle-${id}` and Tesla as
    // `tesla-${id}` — no `(site, externalId)` collisions across
    // the two plugins, so the dedup pass is a no-op.
    expect(res.body.count).toBe(res.body.raw_count);
  });

  it('cross-plugin with ?dedup=false → flag is false, count equals raw_count', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search?dedup=false')
      .send({
        siteType: [Site.ORACLE, Site.MERCOR, Site.TESLA],
        companySlug: 'eeho-us2',
        resultsWanted: 50,
        descriptionDepth: 'board',
      })
      .expect(201);

    expect(res.body).toHaveProperty('deduped', false);
    expect(res.body.count).toBe(res.body.raw_count);
    expect(res.body.count).toBeGreaterThan(0);
  });
});
