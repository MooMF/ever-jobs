/**
 * E2E test for the ClearCompany ATS scraper.
 *
 * No authentication required — ClearCompany careers sites expose a public jobs
 * feed (`GET /api/v1/careers/jobs` with the `API-ShortName: {slug}` header).
 * Tests run against a known ClearCompany-powered tenant but tolerate upstream
 * changes / WAF gating by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ClearCompanyModule, ClearCompanyService } from '@ever-jobs/source-ats-clearcompany';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ClearCompanyService (E2E)', () => {
  let service: ClearCompanyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClearCompanyModule],
    }).compile();

    service = module.get<ClearCompanyService>(ClearCompanyService);
  });

  it('should return job results for a known ClearCompany tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEARCOMPANY],
      companySlug: 'clearcompany',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.CLEARCOMPANY);
      expect(job.atsType).toBe('clearcompany');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEARCOMPANY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEARCOMPANY],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEARCOMPANY],
      companySlug: 'clearcompany',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
