/**
 * E2E test for the Eightfold AI scraper.
 *
 * No authentication required — Eightfold career sites expose a public
 * positions API. Tests run against known Eightfold-powered tenants but tolerate
 * upstream changes / WAF gating by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EightfoldModule, EightfoldService } from '@ever-jobs/source-ats-eightfold';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('EightfoldService (E2E)', () => {
  let service: EightfoldService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EightfoldModule],
    }).compile();

    service = module.get<EightfoldService>(EightfoldService);
  });

  it('should return job results for a known Eightfold tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EIGHTFOLD],
      companySlug: 'nvidia',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.EIGHTFOLD);
      expect(job.atsType).toBe('eightfold');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EIGHTFOLD],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EIGHTFOLD],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EIGHTFOLD],
      companySlug: 'nvidia',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
