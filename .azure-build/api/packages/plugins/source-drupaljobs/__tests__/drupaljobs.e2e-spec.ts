import { Test, TestingModule } from '@nestjs/testing';
import { DrupalJobsModule, DrupalJobsService } from '@ever-jobs/source-drupaljobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('DrupalJobsService (E2E)', () => {
  let service: DrupalJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DrupalJobsModule],
    }).compile();
    service = module.get<DrupalJobsService>(DrupalJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DRUPALJOBS],
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
      expect(job.site).toBe(Site.DRUPALJOBS);
      expect(job.id).toMatch(/^drupaljobs-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DRUPALJOBS],
      resultsWanted: 3,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DRUPALJOBS],
      searchTerm: 'developer',
      resultsWanted: 5,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
