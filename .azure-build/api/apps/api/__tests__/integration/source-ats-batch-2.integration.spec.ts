/**
 * Integration test — Spec 013 / T11.
 *
 * Wires the **real** `AppModule` (full Nest bootstrap) with the only
 * external surface — `@ever-jobs/common`'s `createHttpClient` —
 * replaced by a fixture-driven router. The router decides per-URL
 * which fixture to return, so the three new batch-2 plugins
 * (`oracle` / `mercor` / `tesla`) exercise their real `scrape()`
 * code paths against deterministic data without hitting the network.
 *
 * Mirrors the structure of Spec 006 / T09's
 * `source-ats-batch-1.integration.spec.ts` — same fixture-router +
 * `jest.mock('@ever-jobs/common', …)` shape, same four-place-
 * registration assertions, same `JobsAggregator` dedup pin.
 *
 * Acceptance from `tasks.md` T11:
 *   - Wires Oracle + Mercor + Tesla through live `JobsService`
 *     fan-out via stubbed `createHttpClient` fixture.
 *   - Asserts each plugin contributes ≥ 1 row.
 *   - Asserts `JobsAggregator` dedup with zero collisions on the
 *     synthetic fixture (Spec 003 / FR-1).
 *   - Tesla-Playwright NOT in this suite — the default
 *     `ALL_SOURCE_MODULES` excludes it per FR-13. We additionally
 *     assert `Site.TESLA_PLAYWRIGHT` is absent from the registry as
 *     a regression guard against accidental auto-import.
 *
 * Wire-format pins (one per plugin) cover the load-bearing
 * upstream-API contracts so a future regression in the URL
 * composition / header set surfaces here, not in production:
 *   - **Oracle:** finder string includes `siteNumber=CX_45001`
 *     (Q-030 default) AND the eight-facet list joined by `;`.
 *   - **Mercor:** GET hits the `/work/listings-explore-page`
 *     endpoint AND `setHeaders` was called with the literal
 *     `Authorization: Bearer` (FR-8).
 *   - **Tesla:** GET hits `/cua-api/apps/careers/state` AND the
 *     follow-up detail-fetch GETs target `/cua-api/careers/job/{id}`.
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

const httpCallLog: { method: 'GET' | 'POST'; url: string }[] = [];
const setHeadersCallLog: Record<string, string>[] = [];

// Oracle's pagination loop needs a different response on subsequent
// pages so the `requisitionList[]` empty guard fires and the loop
// terminates. First call → fixture; subsequent → empty.
const oracleGetCount: Map<string, number> = new Map();

function routeGet(url: string): unknown {
  httpCallLog.push({ method: 'GET', url });

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

  // Default — null body. Keeps the integration suite resilient
  // against late-introduced plugins that share `siteType` enum
  // keys by returning a benign payload.
  return null;
}

function routePost(url: string): unknown {
  httpCallLog.push({ method: 'POST', url });
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
      setHeaders: jest.fn((headers: Record<string, string>) => {
        setHeadersCallLog.push(headers);
      }),
    })),
  };
});

// ── Now import the app — AFTER the mock is installed ──────────────────
// eslint-disable-next-line import/first
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line import/first
import {
  JobPostDto,
  ScraperInputDto,
  Site,
} from '@ever-jobs/models';
// eslint-disable-next-line import/first
import { PluginRegistry } from '@ever-jobs/plugin';
// eslint-disable-next-line import/first
import { JobsAggregator } from '../../src/jobs/jobs.aggregator';
// eslint-disable-next-line import/first
import { JobsService } from '../../src/jobs/jobs.service';
// eslint-disable-next-line import/first
import { createTestApp } from '../helpers/create-app';

describe('Integration — Spec 013 / T11 (source-ats batch 2: oracle × mercor × tesla)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    oracleGetCount.clear();
    httpCallLog.length = 0;
    setHeadersCallLog.length = 0;
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    oracleGetCount.clear();
    httpCallLog.length = 0;
    setHeadersCallLog.length = 0;
  });

  describe('four-place registration (PluginRegistry)', () => {
    it('PluginRegistry holds Site.ORACLE / Site.MERCOR / Site.TESLA after AppModule boots', () => {
      const registry = app.get(PluginRegistry);
      const keys = registry.listSiteKeys();
      expect(keys).toContain(Site.ORACLE);
      expect(keys).toContain(Site.MERCOR);
      expect(keys).toContain(Site.TESLA);
    });

    it('Tesla-Playwright is NOT auto-registered (FR-13 — opt-in companion only)', () => {
      const registry = app.get(PluginRegistry);
      const keys = registry.listSiteKeys();
      expect(keys).not.toContain(Site.TESLA_PLAYWRIGHT);
    });

    it('Oracle and Mercor are flagged as ATS sources; Tesla is not', () => {
      const registry = app.get(PluginRegistry);
      const ats = new Set(registry.listAtsSites());
      expect(ats.has(Site.ORACLE)).toBe(true);
      expect(ats.has(Site.MERCOR)).toBe(true);
      // Tesla is `category: 'company'`, `isAts: false` per its
      // `@SourcePlugin` decoration — single-tenant custom careers
      // site, not a multi-tenant ATS.
      expect(ats.has(Site.TESLA)).toBe(false);
    });

    it('each new plugin has a real IScraper bound (registry.getScraper returns truthy)', () => {
      const registry = app.get(PluginRegistry);
      expect(registry.getScraper(Site.ORACLE)).toBeDefined();
      expect(registry.getScraper(Site.MERCOR)).toBeDefined();
      expect(registry.getScraper(Site.TESLA)).toBeDefined();
    });
  });

  describe('JobsService.searchJobs fan-out across the three plugins', () => {
    it('emits ≥ 1 row from each of the three new plugins on a single fan-out', async () => {
      const jobsService = app.get(JobsService);
      const input = new ScraperInputDto({
        siteType: [Site.ORACLE, Site.MERCOR, Site.TESLA],
        // Oracle and Mercor honour `companySlug` differently:
        //   - Oracle treats it as `<subdomain>-<region>` →
        //     composes to `https://eeho.fa.us2.oraclecloud.com`.
        //   - Mercor treats it as a substring filter on
        //     `companyName` (case-insensitive).
        // Tesla is single-tenant — `companySlug` is ignored.
        // We pass `eeho-us2` to satisfy Oracle; Mercor will filter
        // on substring match and emit zero rows (no companyName
        // contains `eeho-us2`), so we layer a per-plugin search
        // for Mercor below as a separate assertion.
        companySlug: 'eeho-us2',
        resultsWanted: 50,
        // Stay within the board-only Tesla budget so the test runs
        // fast (no per-job detail GETs against synthetic fixtures
        // beyond the three we ship).
        descriptionDepth: 'board',
      });

      const rows: JobPostDto[] = await jobsService.searchJobs(input);

      const bySite = (s: Site) => rows.filter((j) => j.site === s);
      // Oracle: `eeho-us2` slug → 5 rows from oracle-page-1.json.
      expect(bySite(Site.ORACLE).length).toBeGreaterThan(0);
      // Mercor: `eeho-us2` slug → no companyName contains it →
      // zero rows. We cover Mercor's happy path in a separate
      // assertion below with a slug that matches.
      expect(bySite(Site.MERCOR).length).toBe(0);
      // Tesla: single-tenant, slug ignored → 50 rows from
      // tesla-board.json.
      expect(bySite(Site.TESLA).length).toBeGreaterThan(0);

      // No row should be missing its `site` tag.
      for (const row of rows) {
        expect(row.site).toBeDefined();
      }
    });

    it('Mercor slug post-filter (`stripe`) emits ≥ 1 row from the explore-page corpus', async () => {
      const jobsService = app.get(JobsService);
      const input = new ScraperInputDto({
        siteType: [Site.MERCOR],
        companySlug: 'stripe',
        resultsWanted: 50,
      });
      const rows = await jobsService.searchJobs(input);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.site).toBe(Site.MERCOR);
        expect((row.companyName ?? '').toLowerCase()).toContain('stripe');
      }
    });

    it('respects resultsWanted on the per-plugin level (Tesla cap fires pre-detail)', async () => {
      const jobsService = app.get(JobsService);
      const input = new ScraperInputDto({
        siteType: [Site.TESLA],
        resultsWanted: 5,
        descriptionDepth: 'board',
      });

      const rows = await jobsService.searchJobs(input);
      expect(rows.length).toBeLessThanOrEqual(5);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.site).toBe(Site.TESLA);
      }
    });
  });

  describe('JobsAggregator — Spec 003 dedup applied to the cross-plugin fan-out', () => {
    it('keeps every row distinct across the three plugins (zero collisions on synthetic fixtures)', async () => {
      const aggregator = app.get(JobsAggregator);
      const input = new ScraperInputDto({
        siteType: [Site.ORACLE, Site.MERCOR, Site.TESLA],
        companySlug: 'eeho-us2',
        resultsWanted: 50,
        descriptionDepth: 'board',
      });

      const result = await aggregator.aggregate(input, { persist: false });

      // Oracle + Tesla contribute (Mercor's `eeho-us2` filter zeros it
      // out — see the fan-out test above for rationale).
      const sites = new Set(result.jobs.map((j) => j.site));
      expect(sites.has(Site.ORACLE)).toBe(true);
      expect(sites.has(Site.TESLA)).toBe(true);

      // Sanity: the dedup engine ran (envelope flag is true).
      expect(result.deduped).toBe(true);

      // Synthetic fixtures don't share canonical-key inputs across
      // plugins (Oracle's `oracle-${id}` namespacing + Tesla's
      // `tesla-${id}` namespacing means zero `(site, externalId)`
      // collisions), so the dedup pass should be a no-op.
      expect(result.outputCount).toBe(result.rawCount);
    });

    it('honours dedup=false opt-out (raw fan-out unchanged, deduped flag false)', async () => {
      const aggregator = app.get(JobsAggregator);
      const input = new ScraperInputDto({
        siteType: [Site.ORACLE, Site.TESLA],
        companySlug: 'eeho-us2',
        resultsWanted: 50,
        descriptionDepth: 'board',
      });

      const result = await aggregator.aggregate(input, {
        dedup: false,
        persist: false,
      });
      expect(result.deduped).toBe(false);
      expect(result.outputCount).toBe(result.rawCount);
      expect(result.jobs.length).toBeGreaterThan(0);
    });
  });

  describe('HTTP-client mock — wire-format pins per plugin', () => {
    it('Oracle finder string includes siteNumber=CX_45001 (Q-030) and the 8-facet list', async () => {
      const jobsService = app.get(JobsService);
      const input = new ScraperInputDto({
        siteType: [Site.ORACLE],
        companySlug: 'eeho-us2',
        resultsWanted: 50,
      });
      await jobsService.searchJobs(input);

      const oracleCalls = httpCallLog.filter(
        (c) => c.method === 'GET' && c.url.includes('oraclecloud.com'),
      );
      expect(oracleCalls.length).toBeGreaterThan(0);
      const firstOracleUrl = oracleCalls[0].url;
      expect(firstOracleUrl).toContain('siteNumber=CX_45001');
      // Eight-facet list joined by `;`. Pin the first and last
      // facet names — full join order is documented in
      // ORACLE_DEFAULT_FACETS.
      expect(firstOracleUrl).toContain('facetsList=LOCATIONS');
      expect(firstOracleUrl).toContain('FLEX_FIELDS');
      expect(firstOracleUrl).toContain('limit=100');
    });

    it('Mercor issues exactly ONE GET to the explore-page endpoint AND sets literal Authorization: Bearer', async () => {
      const jobsService = app.get(JobsService);
      const input = new ScraperInputDto({
        siteType: [Site.MERCOR],
        companySlug: 'stripe',
        resultsWanted: 50,
      });
      await jobsService.searchJobs(input);

      const mercorGets = httpCallLog.filter(
        (c) =>
          c.method === 'GET' &&
          c.url.includes('aws.api.mercor.com/work/listings-explore-page'),
      );
      expect(mercorGets).toHaveLength(1);

      // Literal `Authorization: Bearer` (empty token) per FR-8.
      const mercorHeaders = setHeadersCallLog.find(
        (h) => h.Authorization === 'Bearer' && h.Origin?.includes('work.mercor.com'),
      );
      expect(mercorHeaders).toBeDefined();
    });

    it('Tesla board GET hits /cua-api/apps/careers/state followed by per-job detail GETs', async () => {
      const jobsService = app.get(JobsService);
      const input = new ScraperInputDto({
        siteType: [Site.TESLA],
        resultsWanted: 3,
        descriptionDepth: 'detail-25',
      });
      await jobsService.searchJobs(input);

      const teslaCalls = httpCallLog.filter(
        (c) => c.method === 'GET' && c.url.includes('tesla.com/cua-api'),
      );
      expect(teslaCalls.length).toBeGreaterThan(1);
      // First call → board endpoint; subsequent → per-job detail.
      expect(teslaCalls[0].url).toContain('/cua-api/apps/careers/state');
      const detailCalls = teslaCalls.filter((c) =>
        c.url.includes('/cua-api/careers/job/'),
      );
      expect(detailCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
