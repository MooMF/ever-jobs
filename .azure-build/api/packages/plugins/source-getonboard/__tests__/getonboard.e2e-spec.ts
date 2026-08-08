import { Test, TestingModule } from '@nestjs/testing';
import { GetOnBoardModule, GetOnBoardService } from '@ever-jobs/source-getonboard';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('GetOnBoardService (E2E)', () => {
  let service: GetOnBoardService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GetOnBoardModule],
    }).compile();

    service = module.get<GetOnBoardService>(GetOnBoardService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GETONBOARD],
      searchTerm: 'developer',
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
      expect(job.site).toBe(Site.GETONBOARD);
      expect(job.id).toMatch(/^getonboard-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GETONBOARD],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
