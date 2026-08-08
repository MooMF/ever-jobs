import { Test, TestingModule } from '@nestjs/testing';
import { CrunchboardModule, CrunchboardService } from '@ever-jobs/source-crunchboard';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CrunchboardService (E2E)', () => {
  let service: CrunchboardService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CrunchboardModule],
    }).compile();
    service = module.get<CrunchboardService>(CrunchboardService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRUNCHBOARD],
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
      expect(job.site).toBe(Site.CRUNCHBOARD);
      expect(job.id).toMatch(/^crunchboard-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRUNCHBOARD],
      resultsWanted: 3,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRUNCHBOARD],
      searchTerm: 'developer',
      resultsWanted: 5,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
