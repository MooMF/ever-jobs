/**
 * E2E test for the Carerix ATS scraper.
 *
 * No authentication required — Carerix tenants ("applications") are provisioned on
 * their own sub-domain `https://{tenant}.carerix.com/` and publish their open
 * vacancies through the bundled, public CxTools XML feeds under `/cxtools/`
 * (`indeedFeed.php`, `jobboardFeed.php`, `RSSx.php`). The adapter resolves the tenant
 * from a `companySlug` (the Carerix application name) or a full `companyUrl` on a
 * `carerix.com` host, probes the feeds in order, and maps each `<job>` / `<item>`
 * element to a JobPostDto keyed by the stable Carerix `publicationID`.
 *
 * The generic job-board / RSS feeds require a per-tenant XML password to be enabled,
 * so a given tenant may legitimately serve an empty / disabled feed. The tests run
 * against a candidate Carerix-powered tenant but tolerate upstream changes / empty
 * feeds by treating zero results as acceptable; the shape assertions only run when
 * jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CarerixModule, CarerixService } from '@ever-jobs/source-ats-carerix';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Candidate Carerix application slug (the tenant sub-domain label on carerix.com).
// Surface researched 2026-06-03; feeds may be password-gated per tenant, so zero
// results is acceptable and the shape assertions are guarded by `length > 0`.
const KNOWN_TENANT = 'demo';

describe('CarerixService (E2E)', () => {
  let service: CarerixService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CarerixModule],
    }).compile();

    service = module.get<CarerixService>(CarerixService);
  });

  it('should return job results for a known Carerix tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CARERIX],
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
      expect(job.site).toBe(Site.CARERIX);
      expect(job.atsType).toBe('carerix');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CARERIX],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CARERIX],
      companyUrl: `https://${KNOWN_TENANT}.carerix.com/cxtools/indeedFeed.php`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CARERIX],
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
      siteType: [Site.CARERIX],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
