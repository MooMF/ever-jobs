/**
 * E2E test for the Jobtrain ATS scraper.
 *
 * No authentication required — Jobtrain tenants publish a public career site at
 * `https://www.jobtrain.co.uk/{tenant}/`. The adapter enumerates a tenant's live
 * roles from the `_JobCard` HTML partial
 * (`GET https://www.jobtrain.co.uk/{tenant}/Home/_JobCard`) and parses each
 * server-rendered detail page's schema.org `JobPosting` JSON-LD. The adapter
 * resolves the tenant from a `companySlug` (the career path segment, e.g.
 * `crossreach`) or a full `companyUrl`. Tests run against a known
 * Jobtrain-powered tenant but tolerate upstream changes / empty boards by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobtrainModule, JobtrainService } from '@ever-jobs/source-ats-jobtrain';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Jobtrain-powered career site (CrossReach — verified live 2026-06-03).
const KNOWN_TENANT = 'crossreach';

describe('JobtrainService (E2E)', () => {
  let service: JobtrainService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobtrainModule],
    }).compile();

    service = module.get<JobtrainService>(JobtrainService);
  });

  it('should return job results for a known Jobtrain tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTRAIN],
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
      expect(job.site).toBe(Site.JOBTRAIN);
      expect(job.atsType).toBe('jobtrain');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTRAIN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTRAIN],
      companyUrl: `https://www.jobtrain.co.uk/${KNOWN_TENANT}/Home/Job`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTRAIN],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTRAIN],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
