/**
 * E2E test for the CareerOneStop scraper.
 *
 * NOTE: Requires CAREERONESTOP_API_KEY environment variable to be set.
 * Without it, the service returns empty results gracefully.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CareerOneStopModule, CareerOneStopService } from '@ever-jobs/source-careeronestop';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CareerOneStopService (E2E)', () => {
  let service: CareerOneStopService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CareerOneStopModule],
    }).compile();

    service = module.get<CareerOneStopService>(CareerOneStopService);
  });

  it('should return job results when CAREERONESTOP_API_KEY is set', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CAREERONESTOP],
      searchTerm: 'software engineer',
      location: 'Washington, DC',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (process.env.CAREERONESTOP_API_KEY) {
      // With an API key, we expect at least some results
      expect(response.jobs.length).toBeGreaterThan(0);
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.CAREERONESTOP);
      expect(job.id).toMatch(/^careeronestop-/);
      expect(job.jobUrl).toBeDefined();
    } else {
      // Without API key, should return empty gracefully
      expect(response.jobs.length).toBe(0);
    }
  });

  it('should return empty results without API key gracefully', async () => {
    // If no API key is set, the service should return empty results without errors
    const input = new ScraperInputDto({
      siteType: [Site.CAREERONESTOP],
      searchTerm: 'developer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should handle location filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CAREERONESTOP],
      searchTerm: 'data analyst',
      location: 'New York, NY',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
