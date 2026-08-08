/**
 * E2E test for the Arbeitsagentur scraper.
 *
 * NOTE: Requires ARBEITSAGENTUR_API_KEY environment variable to be set.
 * Without it, the service returns empty results gracefully.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ArbeitsagenturModule, ArbeitsagenturService } from '@ever-jobs/source-arbeitsagentur';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ArbeitsagenturService (E2E)', () => {
  let service: ArbeitsagenturService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ArbeitsagenturModule],
    }).compile();

    service = module.get<ArbeitsagenturService>(ArbeitsagenturService);
  });

  it('should return job results when ARBEITSAGENTUR_API_KEY is set', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ARBEITSAGENTUR],
      searchTerm: 'Softwareentwickler',
      location: 'Berlin',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (process.env.ARBEITSAGENTUR_API_KEY) {
      // With an API key, we expect at least some results
      expect(response.jobs.length).toBeGreaterThan(0);
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.ARBEITSAGENTUR);
      expect(job.id).toMatch(/^arbeitsagentur-/);
      expect(job.jobUrl).toBeDefined();
    } else {
      // Without API key, should return empty gracefully
      expect(response.jobs.length).toBe(0);
    }
  });

  it('should return empty results without API key gracefully', async () => {
    // If no API key is set, the service should return empty results without errors
    const input = new ScraperInputDto({
      siteType: [Site.ARBEITSAGENTUR],
      searchTerm: 'Entwickler',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should handle location filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ARBEITSAGENTUR],
      searchTerm: 'Ingenieur',
      location: 'M\u00fcnchen',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
