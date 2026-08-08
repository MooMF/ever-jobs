/**
 * E2E test for the Hireful (LiveVacancies) ATS scraper.
 *
 * No authentication required — Hireful tenants publish a public candidate portal
 * on the LiveVacancies platform (`https://{tenant}.livevacancies.co.uk/`) whose
 * open roles are enumerated by a public XML sitemap (`/sitemap.xml`) and detailed
 * on server-rendered pages carrying schema.org `JobPosting` JSON-LD. The adapter
 * resolves the careers host from a `companySlug` (the sub-domain label, e.g.
 * `thebigissue`) or a full `companyUrl`. Tests run against a known
 * Hireful-powered tenant but tolerate upstream changes / empty feeds by treating
 * zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HirefulModule, HirefulService } from '@ever-jobs/source-ats-hireful';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Hireful-powered candidate portal (The Big Issue — confirmed 2026-06-03).
const KNOWN_TENANT = 'thebigissue';

describe('HirefulService (E2E)', () => {
  let service: HirefulService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HirefulModule],
    }).compile();

    service = module.get<HirefulService>(HirefulService);
  });

  it('should return job results for a known Hireful tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREFUL],
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
      expect(job.site).toBe(Site.HIREFUL);
      expect(job.atsType).toBe('hireful');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREFUL],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREFUL],
      companyUrl: `https://${KNOWN_TENANT}.livevacancies.co.uk/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREFUL],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREFUL],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
