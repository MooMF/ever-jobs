import { Test, TestingModule } from '@nestjs/testing';
import { JobsAcUkModule, JobsAcUkService } from '@ever-jobs/source-jobsacuk';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobsAcUkService (E2E)', () => {
  let service: JobsAcUkService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobsAcUkModule],
    }).compile();

    service = module.get<JobsAcUkService>(JobsAcUkService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSACUK],
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
      expect(job.site).toBe(Site.JOBSACUK);
      expect(job.id).toMatch(/^jobsacuk-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSACUK],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
