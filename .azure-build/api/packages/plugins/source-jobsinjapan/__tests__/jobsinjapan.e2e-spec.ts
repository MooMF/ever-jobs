import { Test, TestingModule } from '@nestjs/testing';
import { JobsInJapanModule, JobsInJapanService } from '@ever-jobs/source-jobsinjapan';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobsInJapanService (E2E)', () => {
  let service: JobsInJapanService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobsInJapanModule],
    }).compile();

    service = module.get<JobsInJapanService>(JobsInJapanService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSINJAPAN],
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
      expect(job.site).toBe(Site.JOBSINJAPAN);
      expect(job.id).toMatch(/^jobsinjapan-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSINJAPAN],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSINJAPAN],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
