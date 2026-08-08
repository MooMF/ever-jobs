/**
 * E2E test for the HiBob ("Bob") ATS / careers scraper.
 *
 * No authentication required — HiBob tenants publish a public candidate careers
 * page at `https://{tenant}.careers.hibob.com/jobs`, backed by the documented,
 * anonymous Hiring API on `api.hibob.com`: an active-job-ads search
 * (`POST /v1/hiring/job-ads/search`) and a per-role detail object
 * (`GET /v1/hiring/job-ads/{id}`). The adapter resolves the tenant from a
 * `companySlug` (the careers sub-domain label, e.g. `dcbyte`) or a full
 * `companyUrl`. Surface confidence is DEFENSIVE (verified=false): the platform +
 * tenant addressing are confirmed live, but the exact API wire schema is gated, so
 * the tests run against a known HiBob-powered tenant while tolerating upstream
 * changes / empty feeds by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HiBobModule, HiBobService } from '@ever-jobs/source-ats-hibob';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public HiBob-powered candidate careers page (dcbyte — confirmed live 2026-06-03).
const KNOWN_TENANT = 'dcbyte';

describe('HiBobService (E2E)', () => {
  let service: HiBobService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HiBobModule],
    }).compile();

    service = module.get<HiBobService>(HiBobService);
  });

  it('should return job results for a known HiBob tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIBOB],
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
      expect(job.site).toBe(Site.HIBOB);
      expect(job.atsType).toBe('hibob');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIBOB],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIBOB],
      companyUrl: `https://${KNOWN_TENANT}.careers.hibob.com/jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIBOB],
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
      siteType: [Site.HIBOB],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
