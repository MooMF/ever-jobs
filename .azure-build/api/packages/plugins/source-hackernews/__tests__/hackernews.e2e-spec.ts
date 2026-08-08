/**
 * E2E test for the HackerNews scraper.
 *
 * Uses the public Hacker News Firebase API (no auth required).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HackerNewsModule, HackerNewsService } from '@ever-jobs/source-hackernews';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('HackerNewsService (E2E)', () => {
  let service: HackerNewsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HackerNewsModule],
    }).compile();

    service = module.get<HackerNewsService>(HackerNewsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HACKERNEWS],
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
      expect(job.site).toBe(Site.HACKERNEWS);
      expect(job.id).toMatch(/^hackernews-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HACKERNEWS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HACKERNEWS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
