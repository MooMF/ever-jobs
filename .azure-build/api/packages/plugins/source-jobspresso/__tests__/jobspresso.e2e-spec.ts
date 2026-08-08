/**
 * E2E test for the Jobspresso scraper.
 *
 * Jobspresso is a remote-focused job board with WordPress RSS feed.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobspressoModule, JobspressoService } from '@ever-jobs/source-jobspresso';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobspressoService (E2E)', () => {
  let service: JobspressoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobspressoModule],
    }).compile();

    service = module.get<JobspressoService>(JobspressoService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSPRESSO],
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
      expect(job.site).toBe(Site.JOBSPRESSO);
      expect(job.id).toMatch(/^jobspresso-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSPRESSO],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSPRESSO],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
