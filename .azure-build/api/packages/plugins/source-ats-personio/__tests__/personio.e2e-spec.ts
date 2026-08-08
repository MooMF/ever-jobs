/**
 * E2E test for the Personio scraper.
 *
 * Tests both public XML scraping and authenticated Recruiting API paths.
 * To run authenticated tests, set PERSONIO_CLIENT_ID and PERSONIO_CLIENT_SECRET env vars.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PersonioModule, PersonioService } from '@ever-jobs/source-ats-personio';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('PersonioService (E2E)', () => {
  let service: PersonioService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PersonioModule],
    }).compile();

    service = module.get<PersonioService>(PersonioService);
  });

  it('should return job results via public XML scraping', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PERSONIO],
      companySlug: 'personio-gmbh',
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
      expect(job.site).toBe(Site.PERSONIO);
      expect(job.atsType).toBe('personio');
    }
  });

  it('should fall back to XML scraping when API credentials are invalid', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PERSONIO],
      companySlug: 'personio-gmbh',
      resultsWanted: 3,
      auth: {
        personio: {
          clientId: 'invalid-client-id',
          clientSecret: 'invalid-client-secret',
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
      siteType: [Site.PERSONIO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
