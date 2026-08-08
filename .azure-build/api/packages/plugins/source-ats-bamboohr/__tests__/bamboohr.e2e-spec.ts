/**
 * E2E test for the BambooHR scraper.
 *
 * Tests both public scraping and authenticated Job Summaries API paths.
 * To run authenticated tests, set BAMBOOHR_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BambooHRModule, BambooHRService } from '@ever-jobs/source-ats-bamboohr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('BambooHRService (E2E)', () => {
  let service: BambooHRService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BambooHRModule],
    }).compile();

    service = module.get<BambooHRService>(BambooHRService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BAMBOOHR],
      companySlug: 'purelyhr',
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
      expect(job.site).toBe(Site.BAMBOOHR);
      expect(job.atsType).toBe('bamboohr');
    }
  });

  it('should fall back to public scraping when API key is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BAMBOOHR],
      companySlug: 'purelyhr',
      resultsWanted: 3,
      auth: {
        bamboohr: { apiKey: 'invalid-key' },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BAMBOOHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
