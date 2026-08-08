/**
 * E2E test for the Employment Hero ATS scraper.
 *
 * No authentication required — Employment Hero tenants publish a public candidate-facing job
 * board at `https://jobs.employmenthero.com/organisations/{slug}` (canonically
 * `https://employmenthero.com/jobs/organisations/{slug}/`), backed by a single public, anonymous
 * JSON API the board itself consumes: a career-page jobs feed
 * `GET https://services.employmenthero.com/ats/api/v1/career_page/organisations/{slug}/jobs?page_index={n}&item_per_page={size}`
 * that returns `{ data: { items: [ …role… ], page_index, total_pages, total_items } }`. The
 * adapter drains the feed page by page and maps each role. Each role's string `id` is the stable
 * ATS id and its `friendly_id` forms the canonical `/jobs/position/{friendlyId}/` detail / apply
 * URL. The adapter resolves the tenant from a `companySlug` (the organisation friendly id, e.g.
 * `employmenthero`) or a full `companyUrl`. Tests run against a known Employment Hero-powered
 * tenant but tolerate upstream changes / empty boards by treating zero results as acceptable;
 * the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EmploymentHeroModule, EmploymentHeroService } from '@ever-jobs/source-ats-employmenthero';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Employment Hero-powered board (Employment Hero's own organisation — confirmed live
// 2026-06-04).
const KNOWN_TENANT = 'employmenthero';

describe('EmploymentHeroService (E2E)', () => {
  let service: EmploymentHeroService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EmploymentHeroModule],
    }).compile();

    service = module.get<EmploymentHeroService>(EmploymentHeroService);
  });

  it('should return job results for a known Employment Hero tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLOYMENTHERO],
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
      expect(job.site).toBe(Site.EMPLOYMENTHERO);
      expect(job.atsType).toBe('employmenthero');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLOYMENTHERO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLOYMENTHERO],
      companyUrl: `https://jobs.employmenthero.com/organisations/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLOYMENTHERO],
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
      siteType: [Site.EMPLOYMENTHERO],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
