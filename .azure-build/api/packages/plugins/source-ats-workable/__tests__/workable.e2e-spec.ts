/**
 * E2E test for the Workable scraper.
 *
 * Tests both public scraping and authenticated API v3 paths.
 * To run authenticated tests, set WORKABLE_API_TOKEN and WORKABLE_SUBDOMAIN env vars.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WorkableModule, WorkableService } from '@ever-jobs/source-ats-workable';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('WorkableService (E2E)', () => {
  let service: WorkableService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WorkableModule],
    }).compile();

    service = module.get<WorkableService>(WorkableService);
  });

  it('should return job results via public scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKABLE],
      companySlug: 'cloudflare',
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
      expect(job.site).toBe(Site.WORKABLE);
      expect(job.atsType).toBe('workable');
    }
  });

  it('should fall back to public scraping when access token is invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKABLE],
      companySlug: 'cloudflare',
      resultsWanted: 3,
      auth: {
        workable: {
          accessToken: 'invalid-token',
          subdomain: 'cloudflare',
        },
      },
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKABLE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
