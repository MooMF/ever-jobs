/**
 * E2E test for the Radancy (TalentBrew) ATS scraper.
 *
 * No authentication required — Radancy career sites are hostname-multi-tenant: each customer
 * runs the same TalentBrew front-end on its own host and exposes a public, anonymous
 * job-results endpoint `GET /{lang}/search-jobs/results?ActiveFacetID=0&CurrentPage={n}&RecordsPerPage={k}&FacetType=0`
 * that returns a JSON envelope `{ filters, results, hasJobs, hasContent }`; the adapter GETs
 * that feed, parses the per-role anchor (title + canonical detail href + `data-job-id`) and
 * the adjacent `job-location` span out of the `results` HTML fragment, drains pages via
 * `CurrentPage`, and maps each tile. Each role's `data-job-id` is the stable ATS id and the
 * anchor href is the canonical detail / apply URL. The adapter resolves the tenant from a
 * `companyUrl` (the career-site host) or a `companySlug` (a host, or a bare label expanded to
 * `{label}.radancy.com`). Tests run against Radancy's own live board but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RadancyModule, RadancyService } from '@ever-jobs/source-ats-radancy';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Radancy-powered career site (Radancy's own board — confirmed live 2026-06-03,
// org id 47123). Passed as a host so it resolves exactly (not via the bare-label default).
const KNOWN_HOST = 'jobs.radancy.com';

describe('RadancyService (E2E)', () => {
  let service: RadancyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RadancyModule],
    }).compile();

    service = module.get<RadancyService>(RadancyService);
  });

  it('should return job results for a known Radancy tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RADANCY],
      companySlug: KNOWN_HOST,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.RADANCY);
      expect(job.atsType).toBe('radancy');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RADANCY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RADANCY],
      companyUrl: `https://${KNOWN_HOST}/en/search-jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RADANCY],
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
      siteType: [Site.RADANCY],
      companySlug: KNOWN_HOST,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
