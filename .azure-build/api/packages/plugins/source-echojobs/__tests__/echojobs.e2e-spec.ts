/**
 * E2E test for the EchoJobs scraper.
 *
 * EchoJobs is a curated tech job board -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EchoJobsModule, EchoJobsService } from '@ever-jobs/source-echojobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('EchoJobsService (E2E)', () => {
  let service: EchoJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EchoJobsModule],
    }).compile();

    service = module.get<EchoJobsService>(EchoJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ECHOJOBS],
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
      expect(job.site).toBe(Site.ECHOJOBS);
      expect(job.id).toMatch(/^echojobs-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ECHOJOBS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ECHOJOBS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
