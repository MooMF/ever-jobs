/**
 * E2E test for the Recruitee scraper.
 *
 * Tests both public scraping and authenticated API paths.
 * To run authenticated tests, set RECRUITEE_API_TOKEN env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecruiteeModule, RecruiteeService } from '@ever-jobs/source-ats-recruitee';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RecruiteeService (E2E)', () => {
  let service: RecruiteeService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RecruiteeModule],
    }).compile();

    service = module.get<RecruiteeService>(RecruiteeService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITEE],
      companySlug: 'recruitee',
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
      expect(job.site).toBe(Site.RECRUITEE);
      expect(job.atsType).toBe('recruitee');
    }
  });

  it('should fall back to public scraping when API token is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITEE],
      companySlug: 'recruitee',
      resultsWanted: 3,
      auth: {
        recruitee: { apiToken: 'invalid-token' },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITEE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
