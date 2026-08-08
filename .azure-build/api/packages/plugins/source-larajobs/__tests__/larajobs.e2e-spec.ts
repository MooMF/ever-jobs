/**
 * E2E test for the LaraJobs scraper.
 *
 * LaraJobs is a Laravel/PHP job board with RSS feed.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { LaraJobsModule, LaraJobsService } from '@ever-jobs/source-larajobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('LaraJobsService (E2E)', () => {
  let service: LaraJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LaraJobsModule],
    }).compile();

    service = module.get<LaraJobsService>(LaraJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LARAJOBS],
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
      expect(job.site).toBe(Site.LARAJOBS);
      expect(job.id).toMatch(/^larajobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LARAJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LARAJOBS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
