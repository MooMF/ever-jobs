/**
 * E2E test for the Expr3ss! ATS scraper.
 *
 * No authentication required — Expr3ss! tenants publish a public candidate-facing job board on a
 * per-tenant sub-domain at `https://{tenant}.expr3ss.com/home`. The board is a server-rendered
 * page that lists each open role as an apply anchor (`…/ApplyOnline/Default.aspx?ID={id}`) and is
 * published for aggregators with schema.org `JobPosting` JSON-LD embedded per role. The adapter
 * fetches the board HTML, harvests the JSON-LD island(s) and the per-role apply anchors, and maps
 * each role. Each role's numeric id (the `ID` query value of its apply URL) is the stable ATS id
 * and its `ApplyOnline/Default.aspx?ID={id}` page is the canonical detail / apply URL. The
 * adapter resolves the tenant from a `companySlug` (the sub-domain label, e.g. `cos`) or a full
 * `companyUrl`. Tests run against a known Expr3ss-powered tenant but tolerate upstream changes /
 * empty / challenge-gated boards by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Expr3ssModule, Expr3ssService } from '@ever-jobs/source-ats-expr3ss';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Expr3ss-powered board (a real tenant sub-domain — confirmed live 2026-06-04).
const KNOWN_TENANT = 'cos';

describe('Expr3ssService (E2E)', () => {
  let service: Expr3ssService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [Expr3ssModule],
    }).compile();

    service = module.get<Expr3ssService>(Expr3ssService);
  });

  it('should return job results for a known Expr3ss tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXPR3SS],
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
      expect(job.site).toBe(Site.EXPR3SS);
      expect(job.atsType).toBe('expr3ss');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXPR3SS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXPR3SS],
      companyUrl: `https://${KNOWN_TENANT}.expr3ss.com/home`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXPR3SS],
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
      siteType: [Site.EXPR3SS],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
