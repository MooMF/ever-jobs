/**
 * E2E test for the Loxo scraper.
 *
 * Tests the public career board endpoint.
 * To run authenticated tests, set LOXO_API_TOKEN env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { LoxoModule, LoxoService } from '@ever-jobs/source-ats-loxo';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('LoxoService (E2E)', () => {
  let service: LoxoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoxoModule],
    }).compile();

    service = module.get<LoxoService>(LoxoService);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LOXO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LOXO],
      companySlug: 'recruitingfirm',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.LOXO);
      expect(job.atsType).toBe('loxo');
      expect(job.atsId).toBeDefined();
    }
  });

  it('should handle invalid companySlug gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LOXO],
      companySlug: 'this-company-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LOXO],
      companySlug: 'recruitingfirm',
      resultsWanted: 2,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });
});
