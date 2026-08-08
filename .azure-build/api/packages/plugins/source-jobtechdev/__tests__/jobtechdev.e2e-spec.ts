import { Test, TestingModule } from '@nestjs/testing';
import { JobTechDevModule, JobTechDevService } from '@ever-jobs/source-jobtechdev';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobTechDevService (E2E)', () => {
  let service: JobTechDevService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobTechDevModule],
    }).compile();

    service = module.get<JobTechDevService>(JobTechDevService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTECHDEV],
      searchTerm: 'software',
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
      expect(job.site).toBe(Site.JOBTECHDEV);
      expect(job.id).toMatch(/^jobtechdev-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTECHDEV],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
