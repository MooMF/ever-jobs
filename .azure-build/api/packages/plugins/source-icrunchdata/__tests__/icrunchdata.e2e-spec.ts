/**
 * E2E test for the iCrunchData scraper.
 *
 * iCrunchData is a data science and analytics job board with RSS feed.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { IcrunchdataModule, IcrunchdataService } from '@ever-jobs/source-icrunchdata';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('IcrunchdataService (E2E)', () => {
  let service: IcrunchdataService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [IcrunchdataModule],
    }).compile();

    service = module.get<IcrunchdataService>(IcrunchdataService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ICRUNCHDATA],
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
      expect(job.site).toBe(Site.ICRUNCHDATA);
      expect(job.id).toMatch(/^icrunchdata-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ICRUNCHDATA],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ICRUNCHDATA],
      searchTerm: 'data',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
