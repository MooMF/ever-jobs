import { Test, TestingModule } from '@nestjs/testing';
import { IosdevjobsModule, IosdevjobsService } from '@ever-jobs/source-iosdevjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('IosdevjobsService (E2E)', () => {
  let service: IosdevjobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [IosdevjobsModule],
    }).compile();

    service = module.get<IosdevjobsService>(IosdevjobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.IOSDEVJOBS],
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
      expect(job.site).toBe(Site.IOSDEVJOBS);
      expect(job.id).toMatch(/^iosdevjobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.IOSDEVJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.IOSDEVJOBS],
      searchTerm: 'ios',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
