import { Test, TestingModule } from '@nestjs/testing';
import { GreenJobsBoardModule, GreenJobsBoardService } from '@ever-jobs/source-greenjobsboard';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('GreenJobsBoardService (E2E)', () => {
  let service: GreenJobsBoardService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GreenJobsBoardModule],
    }).compile();

    service = module.get<GreenJobsBoardService>(GreenJobsBoardService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREENJOBSBOARD],
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
      expect(job.site).toBe(Site.GREENJOBSBOARD);
      expect(job.id).toMatch(/^greenjobsboard-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREENJOBSBOARD],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREENJOBSBOARD],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
