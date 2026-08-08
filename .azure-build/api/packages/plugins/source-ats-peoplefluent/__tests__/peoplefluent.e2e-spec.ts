/**
 * E2E test for the PeopleFluent ATS scraper.
 *
 * No authentication required — PeopleFluent tenants publish a public candidate-facing
 * career site on the shared PeopleClick RMS host at
 * `https://careers.peopleclick.com/careerscp/client_{tenant}/external/...`. The
 * server-rendered results view renders each open role as an anchor pointing at the
 * canonical detail page (`…/jobDetails/jobDetail.html?jobPostId={id}`), which the adapter
 * parses; the numeric `jobPostId` is the stable ATS id. The adapter resolves the tenant
 * from a `companySlug` (the RMS client code, e.g. `mit`) or a full `companyUrl`. Tests
 * run against a known PeopleFluent-powered tenant but tolerate upstream changes / empty
 * boards by treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PeopleFluentModule, PeopleFluentService } from '@ever-jobs/source-ats-peoplefluent';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public PeopleFluent-powered RMS career site (MIT — observed live 2026-06-03).
const KNOWN_TENANT = 'mit';

describe('PeopleFluentService (E2E)', () => {
  let service: PeopleFluentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PeopleFluentModule],
    }).compile();

    service = module.get<PeopleFluentService>(PeopleFluentService);
  });

  it('should return job results for a known PeopleFluent tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEFLUENT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.PEOPLEFLUENT);
      expect(job.atsType).toBe('peoplefluent');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEFLUENT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEFLUENT],
      companyUrl: `https://careers.peopleclick.com/careerscp/client_${KNOWN_TENANT}/external/search.do`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEFLUENT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEFLUENT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
