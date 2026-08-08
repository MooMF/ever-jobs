/**
 * E2E test for the Talentera ATS scraper.
 *
 * No authentication required — Talentera tenants publish a public candidate-facing career portal
 * on a per-tenant sub-domain (`https://{codename}.talentera.com/`), backed by a public,
 * anonymous JSON endpoint the board's Vue SPA consumes: the job-search manager
 * `GET /app/control/byt_job_search_manager?action=1&token={t}&query={qs}&body=job-search-results&lan=en`,
 * which returns `{ totalJobs, currentPage, view, jobs: [ …role… ] }`. The adapter loads the
 * public `/en/job-search-results/` page to mint an anonymous guest token + session cookies, then
 * drains the search manager page by page and maps each role. Each role's string `id` is the
 * stable ATS id; the canonical detail page is `/en/{country}/jobs/{slug}-{id}/` and the apply
 * page is `/en/job-application/?jb_id={id}`. The adapter resolves the tenant from a `companySlug`
 * (the sub-domain codename, e.g. `careerroyaljet`) or a full `companyUrl`. Tests run against a
 * known Talentera-powered tenant but tolerate upstream changes / empty boards / the portal's
 * anti-automation guard by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TalenteraModule, TalenteraService } from '@ever-jobs/source-ats-talentera';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Talentera-powered tenant career portal (confirmed live 2026-06-04).
const KNOWN_TENANT = 'careerroyaljet';

describe('TalenteraService (E2E)', () => {
  let service: TalenteraService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TalenteraModule],
    }).compile();

    service = module.get<TalenteraService>(TalenteraService);
  });

  it('should return job results for a known Talentera tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTERA],
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
      expect(job.site).toBe(Site.TALENTERA);
      expect(job.atsType).toBe('talentera');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTERA],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTERA],
      companyUrl: `https://${KNOWN_TENANT}.talentera.com/en/job-search-results/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTERA],
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
      siteType: [Site.TALENTERA],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
