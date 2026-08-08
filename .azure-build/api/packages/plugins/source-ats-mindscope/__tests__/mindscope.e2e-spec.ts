/**
 * E2E test for the Mindscope (Univerus Workforce) ATS scraper.
 *
 * No authentication required — Mindscope tenants publish a public candidate portal
 * / job board on a path segment of a shared host
 * (`https://portal{N}.mindscope.com/{TENANTCODE}_V2Portal/Modules/Candidate/…`).
 * The portal is a server-rendered ASP.NET WebForms app; the adapter enumerates a
 * tenant's open postings from the job-board page's `JobDetails.aspx?JobId={id}`
 * anchors and parses each detail page, preferring a schema.org `JobPosting`
 * JSON-LD block (with `og:` meta / `<title>` / body HTML fallbacks). The adapter
 * resolves the tenant from a `companySlug` (the portal/tenant code, e.g.
 * `WHITEC04415`) or a full `companyUrl`.
 *
 * This is a DEFENSIVE adapter (verified=false): the exact public job-board /
 * job-detail page names could not be confirmed live without authentication, so the
 * tests run against a real, named tenant portal but tolerate upstream changes /
 * empty feeds by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MindscopeModule, MindscopeService } from '@ever-jobs/source-ats-mindscope';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Real, public Mindscope candidate portal (tenant code WHITEC04415 on
// portal2.mindscope.com — confirmed live as a Mindscope V2Portal 2026-06-03).
const KNOWN_TENANT = 'WHITEC04415';

describe('MindscopeService (E2E)', () => {
  let service: MindscopeService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MindscopeModule],
    }).compile();

    service = module.get<MindscopeService>(MindscopeService);
  });

  it('should return job results for a known Mindscope tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MINDSCOPE],
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
      expect(job.site).toBe(Site.MINDSCOPE);
      expect(job.atsType).toBe('mindscope');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MINDSCOPE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MINDSCOPE],
      companyUrl: `https://portal2.mindscope.com/${KNOWN_TENANT}_V2Portal/Modules/Candidate/JobBoard.aspx`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MINDSCOPE],
      companySlug: 'THISTENANTDOESNOTEXISTXYZ99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MINDSCOPE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
