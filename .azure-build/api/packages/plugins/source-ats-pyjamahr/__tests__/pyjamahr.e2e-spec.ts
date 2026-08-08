/**
 * E2E test for the PyjamaHR ATS scraper.
 *
 * No authentication required — PyjamaHR tenants publish a public candidate portal
 * at `https://jobs.pyjamahr.com/{tenant}`, backed by an unauthenticated JSON API
 * on `api.pyjamahr.com` keyed by `company_slug`: a paginated open-roles list
 * (`/api/career/jobs/?company_slug={tenant}`) and a per-role detail object
 * (`/api/career/jobs/{id}/?company_slug={tenant}`). The adapter resolves the
 * tenant from a `companySlug` (the company slug, e.g. `jobscubicle`) or a full
 * `companyUrl`. Tests run against a known PyjamaHR-powered tenant but tolerate
 * upstream changes / empty feeds by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PyjamaHrModule, PyjamaHrService } from '@ever-jobs/source-ats-pyjamahr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public PyjamaHR-powered candidate portal (Jobscubicle — confirmed live 2026-06-03).
const KNOWN_TENANT = 'jobscubicle';

describe('PyjamaHrService (E2E)', () => {
  let service: PyjamaHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PyjamaHrModule],
    }).compile();

    service = module.get<PyjamaHrService>(PyjamaHrService);
  });

  it('should return job results for a known PyjamaHR tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYJAMAHR],
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
      expect(job.site).toBe(Site.PYJAMAHR);
      expect(job.atsType).toBe('pyjamahr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYJAMAHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYJAMAHR],
      companyUrl: `https://jobs.pyjamahr.com/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYJAMAHR],
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
      siteType: [Site.PYJAMAHR],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
