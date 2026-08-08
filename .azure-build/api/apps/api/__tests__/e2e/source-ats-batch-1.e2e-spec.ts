/**
 * E2E test — Spec 006 / T10.
 *
 * Hits the real HTTP surface (`POST /api/jobs/search`) of a fully
 * bootstrapped `AppModule`, with the only external dependency —
 * `@ever-jobs/common`'s `createHttpClient` — replaced by a fixture
 * router. Verifies that the three new ATS plugins
 * (`avature` / `gem` / `join_com`) round-trip through the controller +
 * cache + dedup pipeline and return non-empty `JobPostDto[]`.
 *
 * Acceptance from `tasks.md`:
 *   "Three GET assertions —
 *    `/api/jobs?site=avature&companySlug=bloomberg`,
 *    `?site=gem&companySlug=accel`,
 *    `?site=join_com&companySlug=primer-ai` — each returns
 *    `200 OK` + non-empty body, against a sandboxed nock-fixture
 *    upstream. Asserts dedup-engine collapses identical postings
 *    across the three plugins (zero collisions on the synthetic
 *    fixture)."
 *
 * Departures from the literal acceptance text:
 *
 *   1. **POST not GET.** The controller exposes
 *      `POST /api/jobs/search` with a JSON body — this is the real
 *      surface (see `apps/api/src/jobs/jobs.controller.ts`). The
 *      tasks-file phrasing predates the body-vs-query refactor;
 *      we honour the *intent* (per-plugin HTTP round-trip) by
 *      hitting the real endpoint shape instead.
 *   2. **Mock `createHttpClient`, not `nock`.** The unit suites for
 *      the three plugins already use the same `jest.mock(@ever-jobs/common)`
 *      pattern; using it here keeps the integration shape consistent
 *      across unit / integration / E2E tiers. `nock` would shadow
 *      the same code path (axios → undici stack) at the network
 *      layer, which is strictly less precise than mocking the
 *      factory itself.
 *   3. **Slug = `acme-corp` for all three.** The unit suites pin
 *      tenant-specific slugs (`bloomberg` / `accel` / `primer-ai`),
 *      but the fixture corpus is a thin synthetic — the same slug
 *      across all three plugins exercises the `same-input → distinct
 *      outputs` branch of the dedup engine (different vendor prefixes
 *      on the canonical id collapse zero pairs).
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

// ── HTTP-client mock — installed BEFORE AppModule is imported ─────────────

const PLUGIN_FIXTURES = (() => {
  const avatureFx = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'plugins',
    'source-ats-avature',
    '__tests__',
    'fixtures',
  );
  const gemFx = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'plugins',
    'source-ats-gem',
    '__tests__',
    'fixtures',
  );
  const joincomFx = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'plugins',
    'source-ats-joincom',
    '__tests__',
    'fixtures',
  );
  return {
    avaturePage1: fs.readFileSync(path.join(avatureFx, 'avature-page-1.html'), 'utf8'),
    avatureEmpty: fs.readFileSync(path.join(avatureFx, 'avature-page-empty.html'), 'utf8'),
    gemBatch: JSON.parse(
      fs.readFileSync(path.join(gemFx, 'gem-batch-response.json'), 'utf8'),
    ) as unknown[],
    joincomCompany: fs.readFileSync(
      path.join(joincomFx, 'joincom-company-page.html'),
      'utf8',
    ),
    joincomJobsPage1: JSON.parse(
      fs.readFileSync(path.join(joincomFx, 'joincom-jobs-page-1.json'), 'utf8'),
    ),
    joincomJobsPage2: JSON.parse(
      fs.readFileSync(path.join(joincomFx, 'joincom-jobs-page-2.json'), 'utf8'),
    ),
    joincomJobsEmpty: JSON.parse(
      fs.readFileSync(path.join(joincomFx, 'joincom-jobs-page-empty.json'), 'utf8'),
    ),
  };
})();

const avatureGetCount: Map<string, number> = new Map();

function avatureRoutedGet(url: string): unknown {
  if (!url.includes('avature.net')) return null;
  const count = (avatureGetCount.get('avature') ?? 0) + 1;
  avatureGetCount.set('avature', count);
  return count === 1 ? PLUGIN_FIXTURES.avaturePage1 : PLUGIN_FIXTURES.avatureEmpty;
}

function routeGet(url: string): unknown {
  if (url.startsWith('https://join.com/companies/') && !url.includes('/api/')) {
    return PLUGIN_FIXTURES.joincomCompany;
  }
  if (url.includes('/api/public/companies/') && url.includes('/jobs')) {
    if (url.includes('page=2')) return PLUGIN_FIXTURES.joincomJobsPage2;
    if (url.includes('page=1')) return PLUGIN_FIXTURES.joincomJobsPage1;
    return PLUGIN_FIXTURES.joincomJobsEmpty;
  }
  return null;
}

function routePost(url: string): unknown {
  if (url.includes('jobs.gem.com/api/public/graphql/batch')) {
    return PLUGIN_FIXTURES.gemBatch;
  }
  return null;
}

jest.mock('@ever-jobs/common', () => {
  const actual = jest.requireActual('@ever-jobs/common');
  return {
    ...actual,
    createHttpClient: jest.fn(() => ({
      get: jest.fn(async (url: string) => {
        if (url.includes('avature.net')) {
          return { data: avatureRoutedGet(url) };
        }
        return { data: routeGet(url) };
      }),
      post: jest.fn(async (url: string, _body: unknown) => {
        return { data: routePost(url) };
      }),
      setHeaders: jest.fn(),
    })),
  };
});

// ── Bootstrap ─────────────────────────────────────────────────────────────
// eslint-disable-next-line import/first
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line import/first
import { Site } from '@ever-jobs/models';
// eslint-disable-next-line import/first
import { createTestApp } from '../helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('E2E — Spec 006 / T10 (POST /api/jobs/search across avature × gem × join_com)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    avatureGetCount.clear();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    avatureGetCount.clear();
  });

  it('avature single-source request → 201 + non-empty job list', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.AVATURE],
        companySlug: 'bloomberg',
        resultsWanted: 5,
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('jobs');
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
    for (const job of res.body.jobs) {
      expect(job.site).toBe(Site.AVATURE);
    }
  });

  it('gem single-source request → 201 + non-empty job list', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.GEM],
        companySlug: 'accel',
        resultsWanted: 50,
      })
      .expect(201);

    expect(res.body.count).toBeGreaterThan(0);
    for (const job of res.body.jobs) {
      expect(job.site).toBe(Site.GEM);
    }
  });

  it('join_com single-source request → 201 + non-empty job list', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.JOIN_COM],
        companySlug: 'primer-ai',
        resultsWanted: 50,
      })
      .expect(201);

    expect(res.body.count).toBeGreaterThan(0);
    for (const job of res.body.jobs) {
      expect(job.site).toBe(Site.JOIN_COM);
    }
  });

  it('cross-plugin fan-out → all three contribute, dedup runs but produces zero collisions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        siteType: [Site.AVATURE, Site.GEM, Site.JOIN_COM],
        companySlug: 'acme-corp',
        resultsWanted: 50,
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('raw_count');
    expect(res.body).toHaveProperty('deduped', true);

    const jobs: Array<{ site: string }> = res.body.jobs;
    const sites = new Set(jobs.map((j) => j.site));
    expect(sites.has(Site.AVATURE)).toBe(true);
    expect(sites.has(Site.GEM)).toBe(true);
    expect(sites.has(Site.JOIN_COM)).toBe(true);

    // Zero collisions on the synthetic fixture: post-dedup count equals
    // the raw fan-out count. A future fixture refactor that shares
    // canonical-key inputs across plugins would relax this assertion.
    expect(res.body.count).toBe(res.body.raw_count);
  });

  it('cross-plugin with ?dedup=false → flag is false, count equals raw_count', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search?dedup=false')
      .send({
        siteType: [Site.AVATURE, Site.GEM, Site.JOIN_COM],
        companySlug: 'acme-corp',
        resultsWanted: 50,
      })
      .expect(201);

    expect(res.body).toHaveProperty('deduped', false);
    expect(res.body.count).toBe(res.body.raw_count);
    expect(res.body.count).toBeGreaterThan(0);
  });
});
