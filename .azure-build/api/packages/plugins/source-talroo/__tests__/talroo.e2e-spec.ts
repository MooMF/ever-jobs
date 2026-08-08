/**
 * E2E test for the Talroo scraper.
 *
 * Requires TALROO_PUBLISHER_ID and TALROO_PUBLISHER_PASS to be set in the environment.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TalrooModule, TalrooService } from '@ever-jobs/source-talroo';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('TalrooService (E2E)', () => {
  let service: TalrooService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TalrooModule],
    }).compile();

    service = module.get<TalrooService>(TalrooService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALROO],
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
      expect(job.site).toBe(Site.TALROO);
      expect(job.id).toMatch(/^talroo-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALROO],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALROO],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
