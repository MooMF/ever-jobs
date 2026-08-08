/**
 * E2E test for the Sesame HR ATS scraper.
 *
 * No authentication required — Sesame HR tenants publish a public candidate-facing career
 * portal at `https://app.sesametime.com/jobs/{company}/all`, backed by a public, anonymous
 * JSON feed. The adapter first resolves the regional backend via the anonymous company
 * finder `GET login.sesametime.com/private/login-finder/v1/company/{company}` → `{ data:
 * { region } }`, then GETs
 * `https://back-{region}.sesametime.com/api/v3/companies/{company}/public-vacancies?page={n}`
 * which returns `{ data, meta }`; the adapter drains pages via `meta.lastPage` and maps each
 * `data[]` role. Each role's UUID `id` is the stable ATS id, and its canonical detail / apply
 * URL is `https://app.sesametime.com/jobs/{company}/{id}` (and `…/apply`). The adapter
 * resolves the company from a `companySlug` (the path segment, e.g. `Sesame`) or a full
 * `companyUrl`. Tests run against a known Sesame-powered tenant but tolerate upstream changes
 * / empty boards by treating zero results as acceptable; the shape assertions only run when
 * jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SesameHrModule, SesameHrService } from '@ever-jobs/source-ats-sesamehr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Sesame-powered career site (Sesame HR's own board — confirmed live 2026-06-03,
// 36 roles across 2 pages). NOTE: the company segment is case-sensitive on the API.
const KNOWN_TENANT = 'Sesame';

describe('SesameHrService (E2E)', () => {
  let service: SesameHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SesameHrModule],
    }).compile();

    service = module.get<SesameHrService>(SesameHrService);
  });

  it('should return job results for a known Sesame HR tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SESAMEHR],
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
      expect(job.site).toBe(Site.SESAMEHR);
      expect(job.atsType).toBe('sesamehr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SESAMEHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SESAMEHR],
      companyUrl: `https://app.sesametime.com/jobs/${KNOWN_TENANT}/all`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SESAMEHR],
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
      siteType: [Site.SESAMEHR],
      // Sesame's own board has multiple pages of roles — exercises pagination + the limit.
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
