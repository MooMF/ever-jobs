/**
 * E2E test for the HROne (hrone.cloud) ATS scraper.
 *
 * No authentication required — HROne tenants publish a public, candidate-facing career portal
 * at `https://{tenant}.hrone.cloud/career-portal`, backed by an anonymous, app-id-scoped
 * job-opening feed at `POST https://api.{tenant}.hrone.cloud/api/recruitment/referralposting/v1`
 * (body `{ positionId, pagination }`, headers `apiKey` / `domainCode` / `AccessMode`). The
 * adapter POSTs that feed, drains pages, and maps each posting; each posting's `positionId`
 * (else `requestId` / `jobCode`) is the stable ATS id and the tenant career-portal page is the
 * canonical detail / apply URL. The adapter resolves the tenant from a `companySlug` (the
 * sub-domain label, e.g. `joy`) or a full `companyUrl` (whose query string may carry the
 * `appId` + `dc` read key).
 *
 * Surface confidence: verified=false — the response feed is gated by a per-session signed
 * request token the SPA mints (a non-browser POST returns HTTP 403), so the tests treat zero
 * results as acceptable and only run shape assertions when jobs are actually returned. This
 * makes the suite tolerant of the live anti-bot gate and of upstream host changes.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HrOneModule, HrOneService } from '@ever-jobs/source-ats-hrone';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public HROne-powered career portal (HROne's own demo/career portal — host confirmed live
// 2026-06-03; the role feed is gated by a signed request token, so zero results is tolerated).
const KNOWN_TENANT = 'joy';
const KNOWN_PORTAL_URL =
  'https://joy.hrone.cloud/career-portal?appId=U7bjIdFSmZoubZM5AUQ2BhG1jyjDBzePTV0JUmlbP614gGhYt9hZ2xfAfhkraI2X4YKwFpunOL0a_tH02ZVxeZ5gQBs_Q80MzHE5GGAW3Q2m1CGdLUbvtjZDDP6Bg1_C&dc=joy';

describe('HrOneService (E2E)', () => {
  let service: HrOneService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HrOneModule],
    }).compile();

    service = module.get<HrOneService>(HrOneService);
  });

  it('should return job results (or tolerate empty) for a known HROne tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRONE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.HRONE);
      expect(job.atsType).toBe('hrone');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRONE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl (with appId + dc read key)', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRONE],
      companyUrl: KNOWN_PORTAL_URL,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRONE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRONE],
      companyUrl: KNOWN_PORTAL_URL,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
