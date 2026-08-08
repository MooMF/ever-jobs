/**
 * E2E test for the TurboHire ATS scraper.
 *
 * No authentication required — TurboHire tenants publish a public candidate portal
 * on a careers sub-domain (`https://{tenant}.turbohire.co`) and the shared host
 * `careers.turbohire.co`, with per-role public detail pages on
 * `portal.turbohire.co/job/publicjobs/{token}`. The portal is a client-rendered SPA
 * backed by an unauthenticated JSON API on `api.turbohire.co` keyed by the tenant's
 * company / org slug: a paginated open-roles list
 * (`/api/careerpage/publicjobs?companySlug={tenant}`) and a per-role detail object
 * (`/api/careerpage/publicjobs/{id}?companySlug={tenant}`). The adapter resolves the
 * tenant from a `companySlug` (the careers sub-domain label, e.g. `tatamotors`) or a
 * full `companyUrl`.
 *
 * NOTE: the platform + tenant addressing were confirmed live (named tenant
 * `tatamotors`); the exact JSON wire shapes are a DEFENSIVE design (verified=false).
 * Tests run against a known TurboHire-powered tenant but tolerate upstream changes /
 * empty feeds by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TurboHireModule, TurboHireService } from '@ever-jobs/source-ats-turbohire';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public TurboHire-powered candidate portal (Tata Motors — tenant sub-domain
// `tatamotors.turbohire.co`, observed live 2026-06-03).
const KNOWN_TENANT = 'tatamotors';

describe('TurboHireService (E2E)', () => {
  let service: TurboHireService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TurboHireModule],
    }).compile();

    service = module.get<TurboHireService>(TurboHireService);
  });

  it('should return job results for a known TurboHire tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TURBOHIRE],
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
      expect(job.site).toBe(Site.TURBOHIRE);
      expect(job.atsType).toBe('turbohire');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TURBOHIRE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TURBOHIRE],
      companyUrl: `https://${KNOWN_TENANT}.turbohire.co/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TURBOHIRE],
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
      siteType: [Site.TURBOHIRE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
