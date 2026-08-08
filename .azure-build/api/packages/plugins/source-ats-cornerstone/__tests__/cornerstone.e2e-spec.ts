/**
 * E2E test for the Cornerstone OnDemand (CSOD) scraper.
 *
 * No operator credentials required — CSOD career sites expose a public,
 * anonymous-token job-search API. Tests run against a known Cornerstone-powered
 * tenant but tolerate upstream changes / WAF gating by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CornerstoneModule, CornerstoneService } from '@ever-jobs/source-ats-cornerstone';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CornerstoneService (E2E)', () => {
  let service: CornerstoneService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CornerstoneModule],
    }).compile();

    service = module.get<CornerstoneService>(CornerstoneService);
  });

  it('should return job results for a known Cornerstone tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CORNERSTONE],
      companySlug: 'ouc',
      siteNumber: '6',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.CORNERSTONE);
      expect(job.atsType).toBe('cornerstone');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CORNERSTONE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CORNERSTONE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CORNERSTONE],
      companySlug: 'ouc',
      siteNumber: '6',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
