/**
 * E2E test for the Eploy ATS scraper.
 *
 * No authentication is required — Eploy career sites expose a public XML
 * datafeed (`GET /feeds/datafeed.ashx?Format=xml`) that the platform's own
 * customer tenants use to syndicate roles to job boards. Tests run against a
 * known Eploy-powered tenant but tolerate upstream changes or WAF gating by
 * treating zero results as acceptable; shape assertions only run when jobs are
 * actually returned.
 *
 * Known live tenant used for testing:
 *   - `companyUrl: 'https://jobs.islington.gov.uk'` — Islington Council (UK)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EployModule, EployService } from '@ever-jobs/source-ats-eploy';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('EployService (E2E)', () => {
  let service: EployService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EployModule],
    }).compile();

    service = module.get<EployService>(EployService);
  });

  it('should return job results for a known Eploy tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EPLOY],
      companyUrl: 'https://jobs.islington.gov.uk',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.EPLOY);
      expect(job.atsType).toBe('eploy');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EPLOY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EPLOY],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EPLOY],
      companyUrl: 'https://jobs.islington.gov.uk',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
