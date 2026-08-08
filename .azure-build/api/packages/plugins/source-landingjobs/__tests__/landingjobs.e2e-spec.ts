/**
 * E2E test for the Landing.jobs scraper.
 *
 * Uses the public Landing.jobs API (no auth required).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { LandingJobsModule, LandingJobsService } from '@ever-jobs/source-landingjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('LandingJobsService (E2E)', () => {
  let service: LandingJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LandingJobsModule],
    }).compile();

    service = module.get<LandingJobsService>(LandingJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LANDINGJOBS],
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
      expect(job.site).toBe(Site.LANDINGJOBS);
      expect(job.id).toMatch(/^landingjobs-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LANDINGJOBS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LANDINGJOBS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
