import { Test, TestingModule } from '@nestjs/testing';
import { FranceTravailModule, FranceTravailService } from '@ever-jobs/source-francetravail';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('FranceTravailService (E2E)', () => {
  let service: FranceTravailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FranceTravailModule],
    }).compile();

    service = module.get<FranceTravailService>(FranceTravailService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FRANCETRAVAIL],
      searchTerm: 'développeur',
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
      expect(job.site).toBe(Site.FRANCETRAVAIL);
      expect(job.id).toMatch(/^francetravail-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FRANCETRAVAIL],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
