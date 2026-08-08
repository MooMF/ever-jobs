/**
 * E2E test for the Greenhouse scraper.
 *
 * Tests both public scraping and authenticated API (Harvest) paths.
 * To run authenticated tests, set GREENHOUSE_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GreenhouseModule, GreenhouseService } from '@ever-jobs/source-ats-greenhouse';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('GreenhouseService (E2E)', () => {
  let service: GreenhouseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GreenhouseModule],
    }).compile();

    service = module.get<GreenhouseService>(GreenhouseService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREENHOUSE],
      companySlug: 'figma',
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
      expect(job.site).toBe(Site.GREENHOUSE);
      expect(job.atsType).toBe('greenhouse');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  });

  it('should return job results via authenticated API when credentials provided', async () => {
    const apiKey = process.env.GREENHOUSE_API_KEY;
    if (!apiKey) {
      // Skip test when no credentials are available
      console.log('Skipping authenticated test: GREENHOUSE_API_KEY not set');
      return;
    }

    const input = new ScraperInputDto({
      siteType: [Site.GREENHOUSE],
      companySlug: 'figma',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
      auth: {
        greenhouse: { apiKey },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.GREENHOUSE);
      expect(job.atsType).toBe('greenhouse');
      // Authenticated API should provide richer data
      expect(job.description).toBeDefined();
    }
  });

  it('should fall back to public scraping when API key is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREENHOUSE],
      companySlug: 'figma',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.MARKDOWN,
      auth: {
        greenhouse: { apiKey: 'invalid-key-12345' },
      },
    });

    // Should not throw — falls back to public scraping
    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results for non-existent company', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREENHOUSE],
      companySlug: 'zzz-nonexistent-company-12345',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREENHOUSE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
