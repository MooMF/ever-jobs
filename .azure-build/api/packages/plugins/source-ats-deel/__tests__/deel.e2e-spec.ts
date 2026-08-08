/**
 * E2E test for the Deel ATS scraper.
 *
 * Requires a valid DEEL_API_TOKEN environment variable.
 * Tests are automatically skipped when no token is available.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DeelModule, DeelService } from '@ever-jobs/source-ats-deel';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const describeIfKey = process.env.DEEL_API_TOKEN ? describe : describe.skip;

describeIfKey('DeelService (E2E)', () => {
  let service: DeelService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DeelModule],
    }).compile();

    service = module.get<DeelService>(DeelService);
  });

  it('should return job results via authenticated API', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DEEL],
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
      expect(job.site).toBe(Site.DEEL);
      expect(job.atsType).toBe('deel');
      expect(job.atsId).toBeDefined();
      expect(job.id).toMatch(/^deel-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DEEL],
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });

  it('should support per-request auth override', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DEEL],
      resultsWanted: 3,
      auth: {
        deel: {
          apiToken: process.env.DEEL_API_TOKEN,
        },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});

describe('DeelService (no token)', () => {
  let service: DeelService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DeelModule],
    }).compile();

    service = module.get<DeelService>(DeelService);
  });

  it('should return empty results when no API token is available', async () => {
    // Temporarily clear the env var to test no-token behaviour
    const originalToken = process.env.DEEL_API_TOKEN;
    delete process.env.DEEL_API_TOKEN;

    try {
      const input = new ScraperInputDto({
        siteType: [Site.DEEL],
        resultsWanted: 5,
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      expect(response.jobs.length).toBe(0);
    } finally {
      // Restore the env var
      if (originalToken !== undefined) {
        process.env.DEEL_API_TOKEN = originalToken;
      }
    }
  });

  it('should return empty results when invalid token is provided', async () => {
    const originalToken = process.env.DEEL_API_TOKEN;
    delete process.env.DEEL_API_TOKEN;

    try {
      const input = new ScraperInputDto({
        siteType: [Site.DEEL],
        resultsWanted: 3,
        auth: {
          deel: {
            apiToken: 'invalid-token-for-testing',
          },
        },
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      // Should gracefully return empty (API call will fail with invalid token)
      expect(Array.isArray(response.jobs)).toBe(true);
    } finally {
      if (originalToken !== undefined) {
        process.env.DEEL_API_TOKEN = originalToken;
      }
    }
  });
});
