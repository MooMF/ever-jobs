/**
 * E2E test for the Namely ATS career-site scraper.
 *
 * No authentication required — Namely tenants publish a public candidate-facing
 * career site on their own sub-domain of `namely.com`
 * (`https://{tenant}.namely.com/careersite`) whose open roles are enumerated by a
 * public XML sitemap (`/sitemap.xml`) and detailed on server-rendered pages
 * carrying schema.org `JobPosting` JSON-LD. The adapter resolves the career-site
 * host from a `companySlug` (the sub-domain label, e.g. `acme`) or a full
 * `companyUrl`. Tests run against a Namely-style tenant slug but tolerate upstream
 * changes / empty feeds by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NamelyModule, NamelyService } from '@ever-jobs/source-ats-namely';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// A Namely-powered candidate career-site tenant slug (sub-domain of namely.com).
const KNOWN_TENANT = 'demo';

describe('NamelyService (E2E)', () => {
  let service: NamelyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NamelyModule],
    }).compile();

    service = module.get<NamelyService>(NamelyService);
  });

  it('should return job results for a known Namely tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NAMELY],
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
      expect(job.site).toBe(Site.NAMELY);
      expect(job.atsType).toBe('namely');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NAMELY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NAMELY],
      companyUrl: `https://${KNOWN_TENANT}.namely.com/careersite`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NAMELY],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NAMELY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
