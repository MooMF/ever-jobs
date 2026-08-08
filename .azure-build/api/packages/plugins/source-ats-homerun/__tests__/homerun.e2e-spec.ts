/**
 * E2E test for the Homerun scraper.
 *
 * Tests authenticated API scraping.
 * To run tests, set HOMERUN_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HomerunModule, HomerunService } from '@ever-jobs/source-ats-homerun';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('HomerunService (E2E)', () => {
  let service: HomerunService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HomerunModule],
    }).compile();

    service = module.get<HomerunService>(HomerunService);
  });

  it('should return job results when API key is set', async () => {
    const apiKey = process.env.HOMERUN_API_KEY;
    if (!apiKey) {
      console.log('Skipping test: HOMERUN_API_KEY not set');
      return;
    }

    const input = new ScraperInputDto({
      siteType: [Site.HOMERUN],
      companySlug: 'homerun',
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
      expect(job.site).toBe(Site.HOMERUN);
      expect(job.atsType).toBe('homerun');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  });

  it('should return empty results when no API key is set', async () => {
    const originalKey = process.env.HOMERUN_API_KEY;
    delete process.env.HOMERUN_API_KEY;

    try {
      const input = new ScraperInputDto({
        siteType: [Site.HOMERUN],
        companySlug: 'homerun',
        resultsWanted: 5,
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      expect(response.jobs.length).toBe(0);
    } finally {
      if (originalKey) {
        process.env.HOMERUN_API_KEY = originalKey;
      }
    }
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HOMERUN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
