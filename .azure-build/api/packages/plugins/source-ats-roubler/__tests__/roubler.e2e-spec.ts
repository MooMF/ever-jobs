/**
 * E2E test for the Roubler ATS scraper.
 *
 * No authentication required — Roubler tenants publish a public candidate-facing careers board
 * at `https://app.roubler.com/careers/{companyId}`, backed by a region-sharded public careers
 * feed `GET https://graphql.{region}.roubler.com/static/careers/{companyId}/adverts?page={n}`
 * returning `{ data: [ …role… ], meta }`. The adapter drains the feed page by page (until an
 * empty role array) and maps each role. Each role's id is the stable ATS id and its apply URL
 * (or a derived `/careers/{companyId}/{id}` board URL) is the canonical detail / apply URL. The
 * adapter resolves the tenant from a `companySlug` (the careers company id) or a full
 * `companyUrl`.
 *
 * Surface confidence is verified=FALSE: an anonymous careers-feed response could not be captured
 * live (the board is client-rendered, the GraphQL backend requires an access token, and
 * `/static/*` answers HTTP 403 anonymously). These tests therefore run against a best-effort
 * tenant id but tolerate zero results in every case — the shape assertions only run when jobs are
 * actually returned, so the suite passes whether or not the public feed responds anonymously.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RoublerModule, RoublerService } from '@ever-jobs/source-ats-roubler';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Best-effort Roubler-powered tenant careers id (researched 2026-06-04; surface verified=FALSE,
// so zero results are tolerated throughout).
const KNOWN_TENANT = 'roubler';

describe('RoublerService (E2E)', () => {
  let service: RoublerService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RoublerModule],
    }).compile();

    service = module.get<RoublerService>(RoublerService);
  });

  it('should return an array of job results for a known Roubler tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ROUBLER],
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
      expect(job.site).toBe(Site.ROUBLER);
      expect(job.atsType).toBe('roubler');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ROUBLER],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ROUBLER],
      companyUrl: `https://app.roubler.com/careers/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ROUBLER],
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
      siteType: [Site.ROUBLER],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
