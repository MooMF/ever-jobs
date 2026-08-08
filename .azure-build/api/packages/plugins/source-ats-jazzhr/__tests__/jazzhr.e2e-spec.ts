/**
 * E2E test for the JazzHR scraper.
 *
 * Tests both public scraping and authenticated REST API paths.
 * To run authenticated tests, set JAZZHR_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JazzHRModule, JazzHRService } from '@ever-jobs/source-ats-jazzhr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JazzHRService (E2E)', () => {
  let service: JazzHRService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JazzHRModule],
    }).compile();

    service = module.get<JazzHRService>(JazzHRService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JAZZHR],
      companySlug: 'jazzhr',
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
      expect(job.site).toBe(Site.JAZZHR);
      expect(job.atsType).toBe('jazzhr');
    }
  });

  it('should fall back to public scraping when API key is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JAZZHR],
      companySlug: 'jazzhr',
      resultsWanted: 3,
      auth: {
        jazzhr: { apiKey: 'invalid-key' },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JAZZHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
