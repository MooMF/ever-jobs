/**
 * E2E test for the ExactHire (HireCentric) ATS scraper.
 *
 * No authentication required — ExactHire tenants publish a public job board at
 * `https://{tenant}.hirecentric.com/jobsearch/`, enumerated via the tenant XML
 * sitemap (`/sitemap.xml`) whose `/jobs/{jobId}.html` detail pages carry
 * structured metadata (schema.org JobPosting JSON-LD when present, else the
 * `og:` meta tags / `<title>` pattern). The adapter resolves the tenant from a
 * `companySlug` (the sub-domain label, e.g. `aflcio`) or a full `companyUrl`.
 * Tests run against a known ExactHire-powered tenant but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ExactHireModule, ExactHireService } from '@ever-jobs/source-ats-exacthire';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public ExactHire-powered careers sub-domain (AFL-CIO — confirmed 2026-06-03).
const KNOWN_TENANT = 'aflcio';

describe('ExactHireService (E2E)', () => {
  let service: ExactHireService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ExactHireModule],
    }).compile();

    service = module.get<ExactHireService>(ExactHireService);
  });

  it('should return job results for a known ExactHire tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXACTHIRE],
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
      expect(job.site).toBe(Site.EXACTHIRE);
      expect(job.atsType).toBe('exacthire');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXACTHIRE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXACTHIRE],
      companyUrl: `https://${KNOWN_TENANT}.hirecentric.com/jobsearch/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXACTHIRE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXACTHIRE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
