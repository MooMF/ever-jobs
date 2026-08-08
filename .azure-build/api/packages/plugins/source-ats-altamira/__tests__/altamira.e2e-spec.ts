/**
 * E2E test for the Altamira Recruiting ATS scraper.
 *
 * No authentication required — Altamira tenants publish a public, server-rendered
 * career site on a sub-domain of `altamiraweb.com`, e.g.
 * `https://{tenant}.altamiraweb.com/` (and a `https://{tenant}.sites.altamiraweb.com/`
 * variant). The adapter consumes the open-roles index at `/jobs`, which lists each
 * open role with a canonical detail URL — the SEO form
 * `/jobs/{Title-Country-Region-City-slug}-{JobID}.htm` or the query form
 * `/jobs/job-details?JobID={JobID}` — the trailing numeric `{JobID}` being the
 * stable ATS id. The adapter resolves the tenant from a `companySlug` (the tenant
 * sub-domain label, e.g. `etinars`) or a full `companyUrl`. Tests run against a
 * known Altamira-powered tenant but tolerate upstream changes / empty boards by
 * treating zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AltamiraModule, AltamiraService } from '@ever-jobs/source-ats-altamira';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Altamira-powered career site (Etinars — confirmed live 2026-06-03).
const KNOWN_TENANT = 'etinars';
// Etinars is hosted on the `*.sites.altamiraweb.com` variant; exercise it via companyUrl.
const KNOWN_TENANT_URL = 'https://etinars.sites.altamiraweb.com/jobs';

describe('AltamiraService (E2E)', () => {
  let service: AltamiraService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AltamiraModule],
    }).compile();

    service = module.get<AltamiraService>(AltamiraService);
  });

  it('should return job results for a known Altamira tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ALTAMIRA],
      companyUrl: KNOWN_TENANT_URL,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.ALTAMIRA);
      expect(job.atsType).toBe('altamira');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ALTAMIRA],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a bare companySlug', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ALTAMIRA],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ALTAMIRA],
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
      siteType: [Site.ALTAMIRA],
      companyUrl: KNOWN_TENANT_URL,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
