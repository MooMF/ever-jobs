import { Test, TestingModule } from '@nestjs/testing';
import { RealWorkFromAnywhereModule, RealWorkFromAnywhereService } from '@ever-jobs/source-realworkfromanywhere';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RealWorkFromAnywhereService (E2E)', () => {
  let service: RealWorkFromAnywhereService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RealWorkFromAnywhereModule],
    }).compile();
    service = module.get<RealWorkFromAnywhereService>(RealWorkFromAnywhereService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REALWORKFROMANYWHERE],
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
      expect(job.site).toBe(Site.REALWORKFROMANYWHERE);
      expect(job.id).toMatch(/^rwfa-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REALWORKFROMANYWHERE],
      resultsWanted: 3,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REALWORKFROMANYWHERE],
      searchTerm: 'developer',
      resultsWanted: 5,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
