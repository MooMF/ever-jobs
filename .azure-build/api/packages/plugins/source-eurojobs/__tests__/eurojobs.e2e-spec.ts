import { Test, TestingModule } from '@nestjs/testing';
import { EurojobsModule, EurojobsService } from '@ever-jobs/source-eurojobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('EurojobsService (E2E)', () => {
  let service: EurojobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EurojobsModule],
    }).compile();

    service = module.get<EurojobsService>(EurojobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EUROJOBS],
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
      expect(job.site).toBe(Site.EUROJOBS);
      expect(job.id).toMatch(/^eurojobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EUROJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EUROJOBS],
      searchTerm: 'developer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
