/**
 * E2E test for the CryptoJobsList scraper.
 *
 * CryptoJobsList is a crypto/web3 job board with RSS feed.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CryptoJobsListModule, CryptoJobsListService } from '@ever-jobs/source-cryptojobslist';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CryptoJobsListService (E2E)', () => {
  let service: CryptoJobsListService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CryptoJobsListModule],
    }).compile();

    service = module.get<CryptoJobsListService>(CryptoJobsListService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRYPTOJOBSLIST],
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
      expect(job.site).toBe(Site.CRYPTOJOBSLIST);
      expect(job.id).toMatch(/^cryptojobslist-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRYPTOJOBSLIST],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRYPTOJOBSLIST],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
