/**
 * E2E test for the InfoJobs scraper.
 *
 * Requires INFOJOBS_CLIENT_ID and INFOJOBS_CLIENT_SECRET to be set in the environment.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { InfoJobsModule, InfoJobsService } from '@ever-jobs/source-infojobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('InfoJobsService (E2E)', () => {
  let service: InfoJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [InfoJobsModule],
    }).compile();

    service = module.get<InfoJobsService>(InfoJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INFOJOBS],
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
      expect(job.site).toBe(Site.INFOJOBS);
      expect(job.id).toMatch(/^infojobs-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INFOJOBS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INFOJOBS],
      searchTerm: 'developer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
