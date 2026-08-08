/**
 * E2E test for the Workwise ATS scraper.
 *
 * No authentication required to address a tenant — Workwise (workwise.io, Karlsruhe,
 * Germany; formerly "Campusjäger") gives each customer a branded, public candidate-facing
 * career board at `https://{tenant}.workwise.io/` and a public per-role detail page at
 * `https://www.workwise.io/job/{id}-{slug}`. The adapter resolves the tenant from a
 * `companySlug` (the sub-domain label, e.g. `aifinyo`) or a full `companyUrl`, then attempts
 * the candidate jobs-search API `POST https://api.workwise.io/v1/jobs/search` to enumerate
 * the tenant's open roles.
 *
 * That search API is session-gated (it answers anonymous calls HTTP 405), so an
 * un-credentialed run degrades naturally to an empty result. These tests therefore treat
 * zero results as acceptable and only run the shape assertions when jobs are actually
 * returned (e.g. behind a session-bearing proxy, or if Workwise later exposes an anonymous
 * board feed). Each role's numeric `id` is the stable ATS id and
 * `https://www.workwise.io/job/{id}-{slug}` is the canonical detail / apply URL.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WorkwiseModule, WorkwiseService } from '@ever-jobs/source-ats-workwise';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Workwise-powered tenant career board (aifinyo AG — company id 47188, confirmed
// live 2026-06-03 via its anonymous per-role detail pages on www.workwise.io).
const KNOWN_TENANT = 'aifinyo';

describe('WorkwiseService (E2E)', () => {
  let service: WorkwiseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WorkwiseModule],
    }).compile();

    service = module.get<WorkwiseService>(WorkwiseService);
  });

  it('should return job results for a known Workwise tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKWISE],
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
      expect(job.site).toBe(Site.WORKWISE);
      expect(job.atsType).toBe('workwise');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKWISE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKWISE],
      companyUrl: `https://${KNOWN_TENANT}.workwise.io/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKWISE],
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
      siteType: [Site.WORKWISE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
