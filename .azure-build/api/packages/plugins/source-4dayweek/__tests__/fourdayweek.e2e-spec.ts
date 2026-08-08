/**
 * E2E test for the 4DayWeek scraper.
 *
 * Hits the live 4DayWeek.io API -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FourDayWeekModule, FourDayWeekService } from '@ever-jobs/source-4dayweek';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('FourDayWeekService (E2E)', () => {
  let service: FourDayWeekService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FourDayWeekModule],
    }).compile();

    service = module.get<FourDayWeekService>(FourDayWeekService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOURDAYWEEK],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.site).toBe(Site.FOURDAYWEEK);
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.id).toMatch(/^4dayweek-/);
    }
  });

  it('should filter by search term', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOURDAYWEEK],
      searchTerm: 'engineer',
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should support markdown description format', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOURDAYWEEK],
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOURDAYWEEK],
      resultsWanted: 2,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });

  it('should handle empty results gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOURDAYWEEK],
      searchTerm: 'zzzznonexistentjobtitlexyz123',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
