/**
 * E2E test for the Tribepad ATS scraper.
 *
 * Tribepad powers public career pages for UK employers. Each tenant's career
 * site is publicly accessible at `https://{slug}.tribepad-gro.com` (for Gro-
 * tier tenants) or on a custom domain. No authentication is required.
 *
 * Tests run against the known live tenant `getsetuk` (Get Set UK, 18 jobs as
 * at 2026-06-03) but tolerate upstream changes / availability issues by
 * treating zero results as acceptable. Shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TribepadModule, TribepadService } from '@ever-jobs/source-ats-tribepad';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('TribepadService (E2E)', () => {
  let service: TribepadService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TribepadModule],
    }).compile();

    service = module.get<TribepadService>(TribepadService);
  });

  it('should return job results for a known Tribepad tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRIBEPAD],
      companySlug: 'getsetuk',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.TRIBEPAD);
      expect(job.atsType).toBe('tribepad');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRIBEPAD],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRIBEPAD],
      companySlug: 'this-slug-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRIBEPAD],
      companySlug: 'getsetuk',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
