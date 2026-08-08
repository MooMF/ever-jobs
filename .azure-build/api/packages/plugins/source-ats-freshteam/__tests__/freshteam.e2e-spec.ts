/**
 * E2E test for the Freshteam scraper.
 *
 * Freshteam requires an API key for all requests.
 * To run these tests, set FRESHTEAM_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FreshteamModule, FreshteamService } from '@ever-jobs/source-ats-freshteam';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const runTests = process.env.FRESHTEAM_API_KEY ? describe : describe.skip;

runTests('FreshteamService (E2E)', () => {
  let service: FreshteamService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FreshteamModule],
    }).compile();

    service = module.get<FreshteamService>(FreshteamService);
  });

  it('should return job results when companySlug and API key are provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FRESHTEAM],
      companySlug: 'freshworks',
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
      expect(job.site).toBe(Site.FRESHTEAM);
      expect(job.atsType).toBe('freshteam');
    }
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FRESHTEAM],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
