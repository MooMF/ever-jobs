/**
 * E2E test for the Polymer ATS scraper.
 *
 * No authentication required — Polymer exposes a public jobs feed
 * (`GET /v1/hire/organizations/{slug}/jobs`). Tests run against a known
 * Polymer-powered tenant but tolerate upstream changes / WAF gating by treating
 * zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PolymerModule, PolymerService } from '@ever-jobs/source-ats-polymer';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('PolymerService (E2E)', () => {
  let service: PolymerService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymerModule],
    }).compile();

    service = module.get<PolymerService>(PolymerService);
  });

  it('should return job results for a known Polymer tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.POLYMER],
      companySlug: 'teton',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.POLYMER);
      expect(job.atsType).toBe('polymer');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.POLYMER],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.POLYMER],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.POLYMER],
      companySlug: 'teton',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
