import { Test, TestingModule } from '@nestjs/testing';
import { GuardianjobsModule, GuardianjobsService } from '@ever-jobs/source-guardianjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('GuardianjobsService (E2E)', () => {
  let service: GuardianjobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GuardianjobsModule],
    }).compile();

    service = module.get<GuardianjobsService>(GuardianjobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GUARDIANJOBS],
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
      expect(job.site).toBe(Site.GUARDIANJOBS);
      expect(job.id).toMatch(/^guardianjobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GUARDIANJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GUARDIANJOBS],
      searchTerm: 'manager',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
