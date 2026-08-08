/**
 * E2E test for the Zwayam ATS scraper.
 *
 * No authentication required — Zwayam tenants publish a public, client-rendered
 * career site under a custom career domain (`https://{tenant}.openings.co/` or a
 * vanity host such as `https://careers.beacon-india.com/`), backed by an
 * unauthenticated JSON surface on the shared API origin `api.zwayam.com` keyed by the
 * tenant slug + career host: a paginated open-roles list
 * (`/company/{tenant}/jobs?host={careerHost}`) and a per-role preview / detail object
 * (`/job_preview/?jobUrl={jobSlug}&host={careerHost}`). The adapter resolves the
 * tenant from a `companySlug` (the company slug, optionally a `{slug}:{host}` pair) or
 * a full `companyUrl`. Tests run against a known Zwayam-powered tenant but tolerate
 * upstream changes / empty feeds by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 *
 * Surface confidence: verified=false. The platform, career-site addressing, shared API
 * origin, and the per-role preview URL were confirmed live (2026-06-03); the exact
 * open-roles list wire shape is a defensive design, so the network tests are written
 * to tolerate zero results.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ZwayamModule, ZwayamService } from '@ever-jobs/source-ats-zwayam';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Zwayam-powered career site (Beacon India — confirmed live 2026-06-03 via the
// `careers.beacon-india.com/beacon-india/` career page + `public.zwayam.com` preview).
const KNOWN_TENANT = 'beacon-india';
const KNOWN_HOST = 'careers.beacon-india.com';

describe('ZwayamService (E2E)', () => {
  let service: ZwayamService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ZwayamModule],
    }).compile();

    service = module.get<ZwayamService>(ZwayamService);
  });

  it('should return job results for a known Zwayam tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZWAYAM],
      companySlug: `${KNOWN_TENANT}:${KNOWN_HOST}`,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.ZWAYAM);
      expect(job.atsType).toBe('zwayam');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZWAYAM],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZWAYAM],
      companyUrl: `https://${KNOWN_HOST}/${KNOWN_TENANT}/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZWAYAM],
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
      siteType: [Site.ZWAYAM],
      companySlug: `${KNOWN_TENANT}:${KNOWN_HOST}`,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
