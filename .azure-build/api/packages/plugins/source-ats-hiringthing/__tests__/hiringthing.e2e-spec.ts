/**
 * E2E test for the HiringThing scraper.
 *
 * HiringThing requires an API key for all requests (Basic Auth).
 * To run these tests, set HIRINGTHING_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HiringThingModule, HiringThingService } from '@ever-jobs/source-ats-hiringthing';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const describeIfKey = process.env.HIRINGTHING_API_KEY ? describe : describe.skip;

describeIfKey('HiringThingService (E2E)', () => {
  let service: HiringThingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HiringThingModule],
    }).compile();

    service = module.get<HiringThingService>(HiringThingService);
  });

  it('should return job results when API key is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIRINGTHING],
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
      expect(job.site).toBe(Site.HIRINGTHING);
      expect(job.atsType).toBe('hiringthing');
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIRINGTHING],
      resultsWanted: 2,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });
});

describe('HiringThingService (no API key)', () => {
  let service: HiringThingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HiringThingModule],
    }).compile();

    service = module.get<HiringThingService>(HiringThingService);
  });

  it('should return empty results when no API key is available', async () => {
    // Temporarily clear the env var to test the guard
    const savedKey = process.env.HIRINGTHING_API_KEY;
    delete process.env.HIRINGTHING_API_KEY;

    try {
      const input = new ScraperInputDto({
        siteType: [Site.HIRINGTHING],
        resultsWanted: 5,
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      expect(response.jobs.length).toBe(0);
    } finally {
      // Restore the env var
      if (savedKey) {
        process.env.HIRINGTHING_API_KEY = savedKey;
      }
    }
  });
});
