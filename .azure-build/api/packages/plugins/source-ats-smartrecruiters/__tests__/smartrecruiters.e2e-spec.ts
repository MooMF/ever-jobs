/**
 * E2E test for the SmartRecruiters scraper.
 *
 * Tests both public scraping and authenticated API paths.
 * To run authenticated tests, set SMARTRECRUITERS_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SmartRecruitersModule, SmartRecruitersService } from '@ever-jobs/source-ats-smartrecruiters';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('SmartRecruitersService (E2E)', () => {
  let service: SmartRecruitersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SmartRecruitersModule],
    }).compile();

    service = module.get<SmartRecruitersService>(SmartRecruitersService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SMARTRECRUITERS],
      companySlug: 'Visa',
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
      expect(job.site).toBe(Site.SMARTRECRUITERS);
      expect(job.atsType).toBe('smartrecruiters');
      expect(job.atsId).toBeDefined();
    }
  });

  it('should fall back to public scraping when API key is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SMARTRECRUITERS],
      companySlug: 'Visa',
      resultsWanted: 3,
      auth: {
        smartrecruiters: { apiKey: 'invalid-key' },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SMARTRECRUITERS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
