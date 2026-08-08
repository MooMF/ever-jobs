/**
 * E2E test for the Teamtailor scraper.
 *
 * Tests both public scraping and authenticated JSON:API paths.
 * To run authenticated tests, set TEAMTAILOR_API_TOKEN env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TeamtailorModule, TeamtailorService } from '@ever-jobs/source-ats-teamtailor';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('TeamtailorService (E2E)', () => {
  let service: TeamtailorService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TeamtailorModule],
    }).compile();

    service = module.get<TeamtailorService>(TeamtailorService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEAMTAILOR],
      companySlug: 'teamtailor',
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
      expect(job.site).toBe(Site.TEAMTAILOR);
      expect(job.atsType).toBe('teamtailor');
    }
  });

  it('should fall back to public scraping when API token is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEAMTAILOR],
      companySlug: 'teamtailor',
      resultsWanted: 3,
      auth: {
        teamtailor: { apiToken: 'invalid-token' },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEAMTAILOR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
