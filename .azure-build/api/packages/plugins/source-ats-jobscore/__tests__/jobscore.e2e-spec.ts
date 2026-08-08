/**
 * E2E test for the JobScore scraper.
 *
 * Tests public feed scraping (no auth required).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobScoreModule, JobScoreService } from '@ever-jobs/source-ats-jobscore';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobScoreService (E2E)', () => {
  let service: JobScoreService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobScoreModule],
    }).compile();

    service = module.get<JobScoreService>(JobScoreService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSCORE],
      companySlug: 'test-company',
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
      expect(job.site).toBe(Site.JOBSCORE);
      expect(job.atsType).toBe('jobscore');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSCORE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSCORE],
      companySlug: 'test-company',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });
});
