/**
 * E2E test for the Access PeopleHR ATS scraper.
 *
 * No authentication required — PeopleHR tenants publish a public candidate-facing job board on a
 * per-tenant sub-domain at `https://{tenant}.peoplehr.net/JobBoard`. The board landing is a
 * single server-rendered HTML page that emits every open role inline as a table row
 * (`<tr class="tabletrHght" data-url="/Pages/JobBoard/Opening.aspx?v={GUID}">`) carrying the
 * role's stable vacancy GUID (the ATS id), a `lblVacancyName` title, a `lblLocation` label, and a
 * `lblDepartment` label, plus the tenant's display name once in `lblCompanyName`. The adapter
 * fetches the single board page and maps each row; each role's `Opening.aspx?v={GUID}` page is
 * the canonical detail / apply URL. The adapter resolves the tenant from a `companySlug` (the
 * bare sub-domain label, e.g. `efigroup`) or a full `companyUrl`. Tests run against a known
 * PeopleHR-powered tenant but tolerate upstream changes / empty boards by treating zero results
 * as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PeopleHrModule, PeopleHrService } from '@ever-jobs/source-ats-peoplehr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public PeopleHR-powered board (EFI Group's careers sub-domain — confirmed live 2026-06-04).
const KNOWN_TENANT = 'efigroup';

describe('PeopleHrService (E2E)', () => {
  let service: PeopleHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PeopleHrModule],
    }).compile();

    service = module.get<PeopleHrService>(PeopleHrService);
  });

  it('should return job results for a known PeopleHR tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEHR],
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
      expect(job.site).toBe(Site.PEOPLEHR);
      expect(job.atsType).toBe('peoplehr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEHR],
      companyUrl: `https://${KNOWN_TENANT}.peoplehr.net/JobBoard`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLEHR],
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
      siteType: [Site.PEOPLEHR],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
