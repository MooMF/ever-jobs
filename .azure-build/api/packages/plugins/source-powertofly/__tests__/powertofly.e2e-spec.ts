/**
 * E2E test for the PowerToFly scraper.
 *
 * PowerToFly is a diversity-focused job board.
 * Uses a public JSON RSS endpoint -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PowertoflyModule, PowertoflyService } from '@ever-jobs/source-powertofly';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('PowertoflyService (E2E)', () => {
  let service: PowertoflyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PowertoflyModule],
    }).compile();

    service = module.get<PowertoflyService>(PowertoflyService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.POWERTOFLY],
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.POWERTOFLY);
      expect(job.id).toMatch(/^powertofly-/);
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.POWERTOFLY],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.POWERTOFLY],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
