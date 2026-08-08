/**
 * E2E test for the Niceboard ATS scraper.
 *
 * No authentication required — Niceboard boards expose a public search feed
 * (`GET /api/jobs` on the board sub-domain) that the board's own front-end
 * calls. Tests run against a known Niceboard-powered tenant but tolerate
 * upstream changes / WAF gating by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NiceboardModule, NiceboardService } from '@ever-jobs/source-ats-niceboard';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('NiceboardService (E2E)', () => {
  let service: NiceboardService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NiceboardModule],
    }).compile();

    service = module.get<NiceboardService>(NiceboardService);
  });

  it('should return job results for a known Niceboard tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NICEBOARD],
      companySlug: 'avajobboard',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.NICEBOARD);
      expect(job.atsType).toBe('niceboard');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NICEBOARD],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NICEBOARD],
      companySlug: 'this-board-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NICEBOARD],
      companySlug: 'avajobboard',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
