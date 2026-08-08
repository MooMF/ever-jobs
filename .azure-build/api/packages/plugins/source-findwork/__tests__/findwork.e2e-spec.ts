/**
 * E2E test for the FindWork scraper.
 *
 * Requires FINDWORK_API_KEY to be set in the environment.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FindWorkModule, FindWorkService } from '@ever-jobs/source-findwork';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('FindWorkService (E2E)', () => {
  let service: FindWorkService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FindWorkModule],
    }).compile();

    service = module.get<FindWorkService>(FindWorkService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FINDWORK],
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
      expect(job.site).toBe(Site.FINDWORK);
      expect(job.id).toMatch(/^findwork-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FINDWORK],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FINDWORK],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
