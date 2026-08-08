/**
 * E2E test for the Fountain scraper.
 *
 * Fountain requires an API key (Bearer token) -- there is no public fallback.
 * Tests are conditionally run: set FOUNTAIN_API_KEY env var to enable.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FountainModule, FountainService } from '@ever-jobs/source-ats-fountain';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const describeIfKey = process.env.FOUNTAIN_API_KEY ? describe : describe.skip;

describeIfKey('FountainService (E2E)', () => {
  let service: FountainService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FountainModule],
    }).compile();

    service = module.get<FountainService>(FountainService);
  });

  it('should return job results with a valid API key', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOUNTAIN],
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
      expect(job.site).toBe(Site.FOUNTAIN);
      expect(job.atsType).toBe('fountain');
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FOUNTAIN],
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });
});

describe('FountainService (no API key)', () => {
  let service: FountainService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FountainModule],
    }).compile();

    service = module.get<FountainService>(FountainService);
  });

  it('should return empty results when no API key is provided', async () => {
    const originalKey = process.env.FOUNTAIN_API_KEY;
    delete process.env.FOUNTAIN_API_KEY;

    try {
      const input = new ScraperInputDto({
        siteType: [Site.FOUNTAIN],
        resultsWanted: 5,
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      expect(response.jobs.length).toBe(0);
    } finally {
      // Restore the original env var
      if (originalKey !== undefined) {
        process.env.FOUNTAIN_API_KEY = originalKey;
      }
    }
  });
});
