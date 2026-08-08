/**
 * E2E test for the HigherEdJobs scraper.
 *
 * HigherEdJobs is a higher education job board with RSS feed.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HigherEdJobsModule, HigherEdJobsService } from '@ever-jobs/source-higheredjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('HigherEdJobsService (E2E)', () => {
  let service: HigherEdJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HigherEdJobsModule],
    }).compile();

    service = module.get<HigherEdJobsService>(HigherEdJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIGHEREDJOBS],
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
      expect(job.site).toBe(Site.HIGHEREDJOBS);
      expect(job.id).toMatch(/^higheredjobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIGHEREDJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIGHEREDJOBS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
