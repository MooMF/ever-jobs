import { Test, TestingModule } from '@nestjs/testing';
import { FreelancerComModule, FreelancerComService } from '@ever-jobs/source-freelancercom';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('FreelancerComService (E2E)', () => {
  let service: FreelancerComService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FreelancerComModule],
    }).compile();

    service = module.get<FreelancerComService>(FreelancerComService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FREELANCERCOM],
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
      expect(job.site).toBe(Site.FREELANCERCOM);
      expect(job.id).toMatch(/^freelancercom-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FREELANCERCOM],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
