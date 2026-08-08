/**
 * E2E test for the Cezanne HR ATS scraper.
 *
 * No authentication required — Cezanne HR tenants publish a public candidate-facing
 * careers board on the shared hosted careers host at
 * `https://cezanneondemand.intervieweb.it/{tenant}/{lang}/career`. The board is a
 * server-rendered page that lists each open role as an anchor to its per-role
 * `…/jobvacancy/{slug}/{id}` detail page; richer boards / detail pages additionally embed
 * schema.org `JobPosting` JSON-LD, both of which the adapter harvests. The adapter resolves
 * the tenant from a `companySlug` (the first path segment, e.g. `bluecresthealth`) or a
 * full `companyUrl`. Tests run against a known Cezanne-powered tenant but tolerate upstream
 * changes / empty or session-gated boards by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CezanneModule, CezanneService } from '@ever-jobs/source-ats-cezanne';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Cezanne OnDemand careers board (Bluecrest — confirmed live host pattern 2026-06-03).
const KNOWN_TENANT = 'bluecresthealth';

describe('CezanneService (E2E)', () => {
  let service: CezanneService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CezanneModule],
    }).compile();

    service = module.get<CezanneService>(CezanneService);
  });

  it('should return job results for a known Cezanne tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEZANNE],
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
      expect(job.site).toBe(Site.CEZANNE);
      expect(job.atsType).toBe('cezanne');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEZANNE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEZANNE],
      companyUrl: `https://cezanneondemand.intervieweb.it/${KNOWN_TENANT}/en/career`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEZANNE],
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
      siteType: [Site.CEZANNE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
