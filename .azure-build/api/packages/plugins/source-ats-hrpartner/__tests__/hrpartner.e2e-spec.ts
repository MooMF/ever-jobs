/**
 * E2E test for the HR Partner ATS scraper.
 *
 * No authentication required — HR Partner tenants publish a public candidate-facing job
 * board at `https://{tenant}.hrpartner.io/jobs`. The board is a server-rendered HTML page
 * (no SPA, no `__NEXT_DATA__` data island, no public JSON API) that emits every open role
 * as a `.job-listing` card carrying a `/jobs/{slug}` title link (the slug is the stable
 * ATS id and the canonical detail / apply URL segment), a `job-content` summary, and
 * `rounded-full` location / category pills, which the adapter parses. The adapter resolves
 * the tenant from a `companySlug` (the sub-domain label, e.g. `employmentoptions`) or a
 * full `companyUrl`. Tests run against a known HR Partner-powered tenant but tolerate
 * upstream changes / empty boards by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HrPartnerModule, HrPartnerService } from '@ever-jobs/source-ats-hrpartner';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public HR Partner-powered job board (Employment Options Inc Trading As Youth Options —
// confirmed live 2026-06-03).
const KNOWN_TENANT = 'employmentoptions';

describe('HrPartnerService (E2E)', () => {
  let service: HrPartnerService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HrPartnerModule],
    }).compile();

    service = module.get<HrPartnerService>(HrPartnerService);
  });

  it('should return job results for a known HR Partner tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRPARTNER],
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
      expect(job.site).toBe(Site.HRPARTNER);
      expect(job.atsType).toBe('hrpartner');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRPARTNER],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRPARTNER],
      companyUrl: `https://${KNOWN_TENANT}.hrpartner.io/jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRPARTNER],
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
      siteType: [Site.HRPARTNER],
      companySlug: KNOWN_TENANT,
      resultsWanted: 1,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(1);
  }, 30000);
});
