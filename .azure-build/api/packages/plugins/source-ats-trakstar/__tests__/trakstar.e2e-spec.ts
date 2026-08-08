/**
 * E2E test for the Trakstar Hire scraper.
 *
 * Trakstar Hire API requires an API key (Basic Auth), so tests that
 * actually hit the API are conditionally skipped when the key is absent.
 * Set TRAKSTAR_API_KEY env var to enable the live tests.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TrakstarModule, TrakstarService } from '@ever-jobs/source-ats-trakstar';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const describeIfKey = process.env.TRAKSTAR_API_KEY ? describe : describe.skip;

describeIfKey('TrakstarService (E2E)', () => {
  let service: TrakstarService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrakstarModule],
    }).compile();

    service = module.get<TrakstarService>(TrakstarService);
  });

  it('should return job results for a known company', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRAKSTAR],
      companySlug: 'demo',
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
      expect(job.site).toBe(Site.TRAKSTAR);
      expect(job.atsType).toBe('trakstar');
      expect(job.atsId).toBeDefined();
    }
  }, 30000);

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRAKSTAR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});

describe('TrakstarService (no API key)', () => {
  let service: TrakstarService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrakstarModule],
    }).compile();

    service = module.get<TrakstarService>(TrakstarService);
  });

  it('should return empty results when no API key is available', async () => {
    // Temporarily clear the env var to test the no-key path
    const originalKey = process.env.TRAKSTAR_API_KEY;
    delete process.env.TRAKSTAR_API_KEY;

    try {
      const input = new ScraperInputDto({
        siteType: [Site.TRAKSTAR],
        companySlug: 'demo',
        resultsWanted: 5,
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      expect(response.jobs.length).toBe(0);
    } finally {
      // Restore the env var
      if (originalKey !== undefined) {
        process.env.TRAKSTAR_API_KEY = originalKey;
      }
    }
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRAKSTAR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
