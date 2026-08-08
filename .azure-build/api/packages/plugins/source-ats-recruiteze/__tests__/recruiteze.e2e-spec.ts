/**
 * E2E test for the Recruiteze ATS scraper.
 *
 * No authentication required — Recruiteze tenants publish a public candidate-facing career
 * board at `https://{tenant}.recruiteze.com/Jobs/AllJobs`, whose jQuery DataTables grid loads
 * its rows from a public, anonymous server-side endpoint `POST /Jobs/LoadFilteredJobs`
 * (carrying the per-tenant encrypted `companyId` harvested from the board page's hidden
 * `#hdnCompanyID` input). That endpoint returns a DataTables envelope
 * `{ draw, recordsTotal, recordsFiltered, data }`; the adapter POSTs it, drains pages by
 * `start` + `length`, and maps each `data[]` role. Each role's numeric `ID` is the stable ATS
 * id and its `Url` is the canonical detail / apply URL. The adapter resolves the tenant from a
 * `companySlug` (the sub-domain label, e.g. `spearmc`) or a full `companyUrl`. Tests run
 * against a known Recruiteze-powered tenant but tolerate upstream changes / empty boards by
 * treating zero results as acceptable; the shape assertions only run when jobs are returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecruitezeModule, RecruitezeService } from '@ever-jobs/source-ats-recruiteze';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Recruiteze-powered career board (SpearMC Consulting — confirmed live 2026-06-03).
const KNOWN_TENANT = 'spearmc';

describe('RecruitezeService (E2E)', () => {
  let service: RecruitezeService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RecruitezeModule],
    }).compile();

    service = module.get<RecruitezeService>(RecruitezeService);
  });

  it('should return job results for a known Recruiteze tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITEZE],
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
      expect(job.site).toBe(Site.RECRUITEZE);
      expect(job.atsType).toBe('recruiteze');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITEZE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITEZE],
      companyUrl: `https://${KNOWN_TENANT}.recruiteze.com/Jobs/AllJobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITEZE],
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
      siteType: [Site.RECRUITEZE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
