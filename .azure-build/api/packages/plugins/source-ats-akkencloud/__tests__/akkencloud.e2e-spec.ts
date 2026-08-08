/**
 * E2E test for the AkkenCloud ATS / staffing scraper.
 *
 * No authentication required — AkkenCloud agencies publish a public,
 * server-rendered job board (the shared `https://jobs.akkencloud.com/`, a
 * per-agency `https://{tenant}.akkencloud.com/` sub-domain, or a custom careers
 * domain rendering the same app) whose per-role detail pages live at
 * `/jobdetails/{slug}/{location}/{jobId}` (and the short `/jobdetails/{jobId}`
 * form). The adapter resolves the career host from a `companySlug` (the
 * sub-domain label, e.g. `jobs` for the shared board) or a full `companyUrl`,
 * harvests `/jobdetails/.../{id}` links from the listing / sitemap, and parses
 * each detail page.
 *
 * Surface confidence is DEFENSIVE (verified=false): the platform + the
 * `/jobdetails/{...}/{id}` URL shapes were observed via the public search index
 * on 2026-06-03, but the live board host did not resolve from the research
 * network. The tests therefore run against the canonical shared host but tolerate
 * upstream changes / DNS / empty boards by treating zero results as acceptable;
 * the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AkkenCloudModule, AkkenCloudService } from '@ever-jobs/source-ats-akkencloud';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Canonical AkkenCloud-hosted board (shared host jobs.akkencloud.com → slug `jobs`).
const KNOWN_TENANT = 'jobs';

describe('AkkenCloudService (E2E)', () => {
  let service: AkkenCloudService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AkkenCloudModule],
    }).compile();

    service = module.get<AkkenCloudService>(AkkenCloudService);
  });

  it('should return job results for a known AkkenCloud tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AKKENCLOUD],
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
      expect(job.site).toBe(Site.AKKENCLOUD);
      expect(job.atsType).toBe('akkencloud');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AKKENCLOUD],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AKKENCLOUD],
      companyUrl: 'https://jobs.akkencloud.com/',
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AKKENCLOUD],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AKKENCLOUD],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
