/**
 * E2E test for the Snaphunt ATS career-site scraper.
 *
 * No authentication required — Snaphunt customers publish a public candidate
 * career-site on the platform (`https://{tenant}.snaphunt.com/`) whose open roles
 * are enumerated by a public XML sitemap (`/sitemap.xml` of `/job/{jobId}` URLs)
 * and whose fully-rendered detail is served from the canonical apex page
 * (`https://snaphunt.com/jobs/{jobId}`) carrying schema.org `JobPosting` JSON-LD.
 * The adapter resolves the career-site host from a `companySlug` (the sub-domain
 * label, e.g. `snappr`) or a full `companyUrl`. Tests run against a known
 * Snaphunt-powered tenant but tolerate upstream changes / empty feeds by treating
 * zero results as acceptable; the shape assertions only run when jobs are actually
 * returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SnaphuntModule, SnaphuntService } from '@ever-jobs/source-ats-snaphunt';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Snaphunt-powered candidate career-site (Snappr — confirmed live 2026-06-03).
const KNOWN_TENANT = 'snappr';

describe('SnaphuntService (E2E)', () => {
  let service: SnaphuntService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SnaphuntModule],
    }).compile();

    service = module.get<SnaphuntService>(SnaphuntService);
  });

  it('should return job results for a known Snaphunt tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SNAPHUNT],
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
      expect(job.site).toBe(Site.SNAPHUNT);
      expect(job.atsType).toBe('snaphunt');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SNAPHUNT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SNAPHUNT],
      companyUrl: `https://${KNOWN_TENANT}.snaphunt.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SNAPHUNT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SNAPHUNT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
