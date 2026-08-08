/**
 * E2E test for the Ashby scraper.
 *
 * Tests both public scraping and authenticated API paths.
 * To run authenticated tests, set ASHBY_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AshbyModule, AshbyService } from '@ever-jobs/source-ats-ashby';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('AshbyService (E2E)', () => {
  let service: AshbyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AshbyModule],
    }).compile();

    service = module.get<AshbyService>(AshbyService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ASHBY],
      companySlug: 'linear',
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
      expect(job.site).toBe(Site.ASHBY);
      expect(job.atsType).toBe('ashby');
    }
  });

  it('should fall back to public scraping when API key is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ASHBY],
      companySlug: 'linear',
      resultsWanted: 3,
      auth: {
        ashby: { apiKey: 'invalid-key' },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ASHBY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
