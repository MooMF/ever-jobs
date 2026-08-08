/**
 * E2E test for the NoFluffJobs scraper.
 *
 * NoFluffJobs is a Polish/CEE tech job board with salary transparency.
 * Uses a public JSON API -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NoFluffJobsModule, NoFluffJobsService } from '@ever-jobs/source-nofluffjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('NoFluffJobsService (E2E)', () => {
  let service: NoFluffJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NoFluffJobsModule],
    }).compile();

    service = module.get<NoFluffJobsService>(NoFluffJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NOFLUFFJOBS],
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.NOFLUFFJOBS);
      expect(job.id).toMatch(/^nofluffjobs-/);
      expect(job.jobUrl).toBeDefined();
      expect(job.jobUrl).toContain('nofluffjobs.com/job/');
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NOFLUFFJOBS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NOFLUFFJOBS],
      searchTerm: 'backend',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
