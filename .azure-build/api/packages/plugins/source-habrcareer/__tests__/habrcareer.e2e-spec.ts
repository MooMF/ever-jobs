/**
 * E2E test for the Habrcareer scraper.
 *
 * Habr Career is a Russian tech job board (career.habr.com).
 * Uses a public JSON API -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HabrcareerModule, HabrcareerService } from '@ever-jobs/source-habrcareer';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('HabrcareerService (E2E)', () => {
  let service: HabrcareerService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HabrcareerModule],
    }).compile();
    service = module.get<HabrcareerService>(HabrcareerService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HABRCAREER],
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
      expect(job.site).toBe(Site.HABRCAREER);
      expect(job.id).toMatch(/^habrcareer-/);
      expect(job.jobUrl).toBeDefined();
      expect(job.jobUrl).toContain('career.habr.com');
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HABRCAREER],
      resultsWanted: 3,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle keyword search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HABRCAREER],
      searchTerm: 'developer',
      resultsWanted: 5,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should map salary information when available', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HABRCAREER],
      resultsWanted: 20,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    // Some jobs may have compensation
    const jobsWithPay = response.jobs.filter((j) => j.compensation != null);
    if (jobsWithPay.length > 0) {
      const comp = jobsWithPay[0].compensation!;
      expect(comp.interval).toBe('monthly');
      expect(
        comp.minAmount != null || comp.maxAmount != null,
      ).toBe(true);
    }
  }, 30000);
});
