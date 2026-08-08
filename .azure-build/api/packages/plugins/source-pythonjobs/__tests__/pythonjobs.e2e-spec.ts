import { Test, TestingModule } from '@nestjs/testing';
import { PythonJobsModule, PythonJobsService } from '@ever-jobs/source-pythonjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('PythonJobsService (E2E)', () => {
  let service: PythonJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PythonJobsModule],
    }).compile();
    service = module.get<PythonJobsService>(PythonJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYTHONJOBS],
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
      expect(job.site).toBe(Site.PYTHONJOBS);
      expect(job.id).toMatch(/^pythonjobs-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYTHONJOBS],
      resultsWanted: 3,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYTHONJOBS],
      searchTerm: 'developer',
      resultsWanted: 5,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
