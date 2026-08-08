/**
 * E2E test for the Bizneo HR ATS scraper.
 *
 * No authentication required — Bizneo HR tenants publish a public, branded Career
 * Site at `https://{tenant}.bizneo.com/jobs`. That board's open-roles index is
 * server-rendered enough to enumerate roles (each open vacancy renders as a
 * `/jobs/{slug}` anchor with card text: title, location, optional brand, and an
 * "On-site" / "Remote" / "Hybrid" work-mode token), while each per-role detail body
 * is hydrated client-side. The adapter parses the index and uses the `{slug}`
 * segment as the stable ATS id, with the canonical detail / apply URL
 * `https://{tenant}.bizneo.com/jobs/{slug}`. The adapter resolves the tenant from a
 * `companySlug` (the sub-domain label, e.g. `groundforce`) or a full `companyUrl`.
 * Tests run against a known Bizneo-powered tenant but tolerate upstream changes /
 * empty feeds by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BizneoModule, BizneoService } from '@ever-jobs/source-ats-bizneo';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Bizneo-powered Career Site (Groundforce — airport handling, ES; confirmed live 2026-06-03).
const KNOWN_TENANT = 'groundforce';

describe('BizneoService (E2E)', () => {
  let service: BizneoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BizneoModule],
    }).compile();

    service = module.get<BizneoService>(BizneoService);
  });

  it('should return job results for a known Bizneo tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BIZNEO],
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
      expect(job.site).toBe(Site.BIZNEO);
      expect(job.atsType).toBe('bizneo');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BIZNEO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BIZNEO],
      companyUrl: `https://${KNOWN_TENANT}.bizneo.com/jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BIZNEO],
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
      siteType: [Site.BIZNEO],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
