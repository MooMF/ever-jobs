/**
 * E2E test for the CleverConnect ATS scraper.
 *
 * No authentication required — CleverConnect tenants publish a public, branded
 * career board at `https://career.{tenant}.cleverconnect.com/jobs`. That board is an
 * Angular SPA, but the server pre-renders the full open-roles payload into the
 * initial HTML document as an Angular TransferState JSON island (HTML-entity-encoded
 * JSON); the adapter decodes that island and parses the embedded offer array. Each
 * offer carries a numeric `id` (the stable ATS id), `title`, `description` (HTML),
 * `locality`, a hiring-company name, and the canonical / short detail paths
 * (`/jobads/{id}`). The adapter resolves the tenant from a `companySlug` (the
 * sub-domain label, e.g. `demo`) or a full `companyUrl`. Tests run against a known
 * CleverConnect-powered tenant but tolerate upstream changes / empty boards by
 * treating zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CleverConnectModule, CleverConnectService } from '@ever-jobs/source-ats-cleverconnect';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public CleverConnect-powered career site (the CleverConnect demo — confirmed live 2026-06-03).
const KNOWN_TENANT = 'demo';

describe('CleverConnectService (E2E)', () => {
  let service: CleverConnectService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CleverConnectModule],
    }).compile();

    service = module.get<CleverConnectService>(CleverConnectService);
  });

  it('should return job results for a known CleverConnect tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEVERCONNECT],
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
      expect(job.site).toBe(Site.CLEVERCONNECT);
      expect(job.atsType).toBe('cleverconnect');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEVERCONNECT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEVERCONNECT],
      companyUrl: `https://career.${KNOWN_TENANT}.cleverconnect.com/jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CLEVERCONNECT],
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
      siteType: [Site.CLEVERCONNECT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
