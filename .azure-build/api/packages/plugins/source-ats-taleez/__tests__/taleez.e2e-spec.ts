/**
 * E2E test for the Taleez (taleez.com) ATS scraper.
 *
 * No authentication required — Taleez tenants publish a public, branded careers board
 * on the shared host as a sub-domain (`https://{tenant}.taleez.com/`) or a path
 * (`https://taleez.com/careers/{tenant}`). The board shell is server-rendered but its
 * role list is client-rendered (an Angular SPA), so the adapter harvests the canonical
 * detail / apply anchors (`https://taleez.com/apply/{slug}`) from the board HTML and
 * parses each role's fully server-rendered detail page (schema.org `JobPosting`
 * JSON-LD). The adapter resolves the tenant from a `companySlug` (the tenant token,
 * e.g. `tehtris`) or a full `companyUrl`. Tests run against a known Taleez-powered
 * tenant but tolerate upstream changes / a client-rendered (anchor-less) board by
 * treating zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TaleezModule, TaleezService } from '@ever-jobs/source-ats-taleez';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Taleez-powered tenant (TEHTRIS — confirmed live 2026-06-03).
const KNOWN_TENANT = 'tehtris';

describe('TaleezService (E2E)', () => {
  let service: TaleezService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaleezModule],
    }).compile();

    service = module.get<TaleezService>(TaleezService);
  });

  it('should return job results (or tolerate an empty board) for a known Taleez tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALEEZ],
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
      expect(job.site).toBe(Site.TALEEZ);
      expect(job.atsType).toBe('taleez');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALEEZ],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALEEZ],
      companyUrl: `https://${KNOWN_TENANT}.taleez.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should resolve and scrape a single role from a direct /apply/{slug} companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALEEZ],
      companyUrl: 'https://taleez.com/apply/mdr-analyst-niveau-3-f-m-x-tehtris-cdi',
      resultsWanted: 1,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.site).toBe(Site.TALEEZ);
      expect(job.atsType).toBe('taleez');
      expect(job.jobUrl).toContain('/apply/');
    }
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALEEZ],
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
      siteType: [Site.TALEEZ],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
