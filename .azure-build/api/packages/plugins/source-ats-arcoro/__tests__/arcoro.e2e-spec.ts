/**
 * E2E test for the Arcoro (BirdDogHR) ATS scraper.
 *
 * No authentication required — Arcoro tenants publish a public, server-rendered
 * job board (`https://{tenant}.birddoghr.com/`, plus the shared
 * `https://jobs.ourcareerpages.com/` host) whose per-role detail pages live at
 * `/job/{jobId}`. The adapter resolves the career host from a `companySlug` (the
 * sub-domain label, e.g. `engineeringjobs`) or a full `companyUrl`, harvests
 * `/job/{id}` links from the listing/sitemap, and parses each detail page. Tests
 * run against a known Arcoro-powered host but tolerate upstream changes / empty
 * boards by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ArcoroModule, ArcoroService } from '@ever-jobs/source-ats-arcoro';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Arcoro/BirdDogHR-powered careers sub-domain (verified live 2026-06-03).
const KNOWN_TENANT = 'engineeringjobs';

describe('ArcoroService (E2E)', () => {
  let service: ArcoroService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ArcoroModule],
    }).compile();

    service = module.get<ArcoroService>(ArcoroService);
  });

  it('should return job results for a known Arcoro tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ARCORO],
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
      expect(job.site).toBe(Site.ARCORO);
      expect(job.atsType).toBe('arcoro');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ARCORO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ARCORO],
      companyUrl: `https://${KNOWN_TENANT}.birddoghr.com/JobSearchAdvanced`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ARCORO],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ARCORO],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
