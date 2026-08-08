/**
 * E2E test for the Jobs.ch scraper.
 *
 * Jobs.ch is Switzerland's largest job board.
 * No authentication required -- the search API is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobsChModule, JobsChService } from '@ever-jobs/source-jobsch';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobsChService (E2E)', () => {
  let service: JobsChService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobsChModule],
    }).compile();

    service = module.get<JobsChService>(JobsChService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSCH],
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
      expect(job.site).toBe(Site.JOBSCH);
      expect(job.id).toMatch(/^jobsch-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSCH],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSCH],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
