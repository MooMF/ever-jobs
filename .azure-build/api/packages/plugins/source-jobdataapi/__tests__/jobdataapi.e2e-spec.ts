/**
 * E2E test for the JobDataAPI scraper.
 *
 * Works without API key (limited to 10 requests/hour).
 * Set JOBDATAAPI_API_KEY for higher limits.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobDataApiModule, JobDataApiService } from '@ever-jobs/source-jobdataapi';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobDataApiService (E2E)', () => {
  let service: JobDataApiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobDataApiModule],
    }).compile();

    service = module.get<JobDataApiService>(JobDataApiService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDATAAPI],
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
      expect(job.site).toBe(Site.JOBDATAAPI);
      expect(job.id).toMatch(/^jobdataapi-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDATAAPI],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDATAAPI],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
