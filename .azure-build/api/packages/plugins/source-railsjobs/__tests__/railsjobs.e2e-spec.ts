import { Test, TestingModule } from '@nestjs/testing';
import { RailsJobsModule, RailsJobsService } from '@ever-jobs/source-railsjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RailsJobsService (E2E)', () => {
  let service: RailsJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RailsJobsModule],
    }).compile();
    service = module.get<RailsJobsService>(RailsJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RAILSJOBS],
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
      expect(job.site).toBe(Site.RAILSJOBS);
      expect(job.id).toMatch(/^railsjobs-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RAILSJOBS],
      resultsWanted: 3,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RAILSJOBS],
      searchTerm: 'developer',
      resultsWanted: 5,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
