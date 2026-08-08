/**
 * E2E test for the ClojureJobs scraper.
 *
 * Clojure Job Board is a niche job board for Clojure programming jobs.
 * Uses a public RSS feed -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ClojurejobsModule, ClojurejobsService } from '@ever-jobs/source-clojurejobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ClojurejobsService (E2E)', () => {
  let service: ClojurejobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClojurejobsModule],
    }).compile();

    service = module.get<ClojurejobsService>(ClojurejobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLOJUREJOBS],
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
      expect(job.site).toBe(Site.CLOJUREJOBS);
      expect(job.id).toMatch(/^clojurejobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLOJUREJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLOJUREJOBS],
      searchTerm: 'clojure',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
