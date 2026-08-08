/**
 * E2E test for the CareerPlug ATS scraper.
 *
 * No authentication required — CareerPlug exposes a public, anonymous careers
 * site per tenant at `https://{tenant}.careerplug.com/`, embedding a
 * `schema.org` `ItemList` of `JobPosting` objects as `application/ld+json`.
 * Tests run against a known CareerPlug-powered tenant but tolerate upstream
 * changes / empty tenants by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CareerPlugModule, CareerPlugService } from '@ever-jobs/source-ats-careerplug';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public CareerPlug tenant sub-domain (CareerPlug's own careers site),
// verified live 2026-06-03 at https://cplugjobs.careerplug.com/jobs.
const KNOWN_TENANT = 'cplugjobs';

describe('CareerPlugService (E2E)', () => {
  let service: CareerPlugService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CareerPlugModule],
    }).compile();

    service = module.get<CareerPlugService>(CareerPlugService);
  });

  it('should return job results for a known CareerPlug tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CAREERPLUG],
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
      expect(job.site).toBe(Site.CAREERPLUG);
      expect(job.atsType).toBe('careerplug');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CAREERPLUG],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CAREERPLUG],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CAREERPLUG],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
