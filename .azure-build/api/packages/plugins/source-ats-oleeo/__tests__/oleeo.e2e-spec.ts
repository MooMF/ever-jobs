/**
 * E2E test for the Oleeo (TAL.net) ATS scraper.
 *
 * No authentication required — Oleeo tenants publish a public candidate careers
 * portal at `https://{tenant}.tal.net/`, with a server-rendered job board reached
 * at the brand-agnostic short path `/candidate/jobboard/vacancy/1/adv/`. The board
 * lists each open opportunity with a canonical detail URL (`…/opp/{ID}-{slug}/en-GB`),
 * whose numeric `{ID}` is the stable ATS id. The adapter resolves the tenant from a
 * `companySlug` (the sub-domain label, e.g. `fcdo`) or a full `companyUrl` on a
 * `tal.net` host. Tests run against a known Oleeo-powered tenant but tolerate
 * upstream changes / empty boards by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OleeoModule, OleeoService } from '@ever-jobs/source-ats-oleeo';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Oleeo-powered candidate portal (UK FCDO — confirmed live 2026-06-03).
const KNOWN_TENANT = 'fcdo';

describe('OleeoService (E2E)', () => {
  let service: OleeoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OleeoModule],
    }).compile();

    service = module.get<OleeoService>(OleeoService);
  });

  it('should return job results for a known Oleeo tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OLEEO],
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
      expect(job.site).toBe(Site.OLEEO);
      expect(job.atsType).toBe('oleeo');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OLEEO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OLEEO],
      companyUrl: `https://${KNOWN_TENANT}.tal.net/candidate`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OLEEO],
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
      siteType: [Site.OLEEO],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
