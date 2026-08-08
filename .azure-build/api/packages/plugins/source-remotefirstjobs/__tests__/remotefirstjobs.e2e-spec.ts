import { Test, TestingModule } from '@nestjs/testing';
import { RemotefirstjobsModule, RemotefirstjobsService } from '@ever-jobs/source-remotefirstjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RemotefirstjobsService (E2E)', () => {
  let service: RemotefirstjobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RemotefirstjobsModule],
    }).compile();

    service = module.get<RemotefirstjobsService>(RemotefirstjobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REMOTEFIRSTJOBS],
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
      expect(job.site).toBe(Site.REMOTEFIRSTJOBS);
      expect(job.id).toMatch(/^remotefirstjobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REMOTEFIRSTJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REMOTEFIRSTJOBS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
