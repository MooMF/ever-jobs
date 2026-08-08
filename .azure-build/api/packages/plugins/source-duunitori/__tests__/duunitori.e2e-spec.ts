import { Test, TestingModule } from '@nestjs/testing';
import { DuunitoriModule, DuunitoriService } from '@ever-jobs/source-duunitori';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('DuunitoriService (E2E)', () => {
  let service: DuunitoriService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DuunitoriModule],
    }).compile();

    service = module.get<DuunitoriService>(DuunitoriService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DUUNITORI],
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
      expect(job.site).toBe(Site.DUUNITORI);
      expect(job.id).toMatch(/^duunitori-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DUUNITORI],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DUUNITORI],
      searchTerm: 'software',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
