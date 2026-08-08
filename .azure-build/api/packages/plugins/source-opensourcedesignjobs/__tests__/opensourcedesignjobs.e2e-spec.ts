import { Test, TestingModule } from '@nestjs/testing';
import { OpensourcedesignjobsModule, OpensourcedesignjobsService } from '@ever-jobs/source-opensourcedesignjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('OpensourcedesignjobsService (E2E)', () => {
  let service: OpensourcedesignjobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OpensourcedesignjobsModule],
    }).compile();

    service = module.get<OpensourcedesignjobsService>(OpensourcedesignjobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OPENSOURCEDESIGNJOBS],
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
      expect(job.site).toBe(Site.OPENSOURCEDESIGNJOBS);
      expect(job.id).toMatch(/^opensourcedesignjobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OPENSOURCEDESIGNJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OPENSOURCEDESIGNJOBS],
      searchTerm: 'design',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
