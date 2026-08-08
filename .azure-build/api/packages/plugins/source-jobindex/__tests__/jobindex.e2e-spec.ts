import { Test, TestingModule } from '@nestjs/testing';
import { JobindexModule, JobindexService } from '@ever-jobs/source-jobindex';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobindexService (E2E)', () => {
  let service: JobindexService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobindexModule],
    }).compile();

    service = module.get<JobindexService>(JobindexService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBINDEX],
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
      expect(job.site).toBe(Site.JOBINDEX);
      expect(job.id).toMatch(/^jobindex-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBINDEX],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
