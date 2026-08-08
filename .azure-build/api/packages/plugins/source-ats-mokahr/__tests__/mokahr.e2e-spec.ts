/**
 * E2E test for the MokaHR ATS scraper.
 *
 * No authentication required — MokaHR tenants publish a public candidate-facing career
 * site at `https://app.mokahr.com/social-recruitment/{tenant}/{orgId}`. The site is a
 * client-rendered SPA whose open roles are served by a public, anonymous JSON listing
 * endpoint (`https://api.mokahr.com/api-platform/v1/jobs/{orgId}?mode=social`), which the
 * adapter consumes; each role's numeric `id` builds the canonical detail / apply URL
 * `…/apply/{tenant}/{orgId}#/job/{jobId}`. The adapter resolves the tenant from a
 * `companySlug` (the `{tenant}/{orgId}` pair, e.g. `tesla/46129`) or a full `companyUrl`.
 * Tests run against a known MokaHR-powered tenant but tolerate upstream changes / empty
 * boards by treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MokaHrModule, MokaHrService } from '@ever-jobs/source-ats-mokahr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public MokaHR-powered career site (Tesla China — tenant slug + orgId confirmed live
// 2026-06-03 at app.mokahr.com/social-recruitment/tesla/46129).
const KNOWN_TENANT = 'tesla/46129';
const KNOWN_SLUG = 'tesla';
const KNOWN_ORG_ID = '46129';

describe('MokaHrService (E2E)', () => {
  let service: MokaHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MokaHrModule],
    }).compile();

    service = module.get<MokaHrService>(MokaHrService);
  });

  it('should return job results for a known MokaHR tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MOKAHR],
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
      expect(job.site).toBe(Site.MOKAHR);
      expect(job.atsType).toBe('mokahr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MOKAHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MOKAHR],
      companyUrl: `https://app.mokahr.com/social-recruitment/${KNOWN_SLUG}/${KNOWN_ORG_ID}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MOKAHR],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz/99999999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should return empty when the slug carries no orgId', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MOKAHR],
      companySlug: KNOWN_SLUG, // bare slug, no `/orgId` — not resolvable
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MOKAHR],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
