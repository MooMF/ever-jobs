/**
 * E2E test for the FossJobs scraper.
 *
 * FossJobs is a Free & Open Source Software job board with RSS feed.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FossJobsModule, FossJobsService } from '@ever-jobs/source-fossjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('FossJobsService (E2E)', () => {
  let service: FossJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FossJobsModule],
    }).compile();

    service = module.get<FossJobsService>(FossJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOSSJOBS],
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
      expect(job.site).toBe(Site.FOSSJOBS);
      expect(job.id).toMatch(/^fossjobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOSSJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOSSJOBS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
