/**
 * E2E test for the Indeed scraper.
 *
 * NOTE: This test hits the live Indeed website and may be rate-limited
 * or blocked depending on your network/IP. Run sparingly.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { IndeedModule, IndeedService } from '@ever-jobs/source-indeed';
import { ScraperInputDto, Site, Country, DescriptionFormat } from '@ever-jobs/models';

describe('IndeedService (E2E)', () => {
  let service: IndeedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [IndeedModule],
    }).compile();

    service = module.get<IndeedService>(IndeedService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INDEED],
      searchTerm: 'software engineer',
      location: 'New York',
      resultsWanted: 5,
      country: Country.USA,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    // We may get 0 results if blocked, but should not throw
    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
    }
  });
});
