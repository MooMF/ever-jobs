/**
 * E2E test for the Concludis ATS scraper.
 *
 * No authentication is required — Concludis tenant career portals expose a
 * public, server-rendered listing page (`/prj/lst/{hash}/…htm`) that embeds
 * every open role, plus per-job detail pages carrying schema.org JSON-LD.
 *
 * Tests run against a known Concludis-powered tenant but tolerate upstream
 * changes, redirects, or WAF gating by treating zero results as acceptable;
 * shape assertions only run when jobs are actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - `companySlug: 'hwk-stuttgart'` — Handwerkskammer Region Stuttgart.
 *     Listing 302s from the portal root; detail pages embed JSON-LD JobPosting.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConcludisModule, ConcludisService } from '@ever-jobs/source-ats-concludis';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ConcludisService (E2E)', () => {
  let service: ConcludisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConcludisModule],
    }).compile();

    service = module.get<ConcludisService>(ConcludisService);
  });

  it('should return shaped job results for a known Concludis tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONCLUDIS],
      companySlug: 'hwk-stuttgart',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect((job.title ?? '').length).toBeGreaterThan(0);
      expect(job.site).toBe(Site.CONCLUDIS);
      expect(job.atsType).toBe('concludis');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
      expect((job.jobUrl ?? '').length).toBeGreaterThan(0);
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONCLUDIS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONCLUDIS],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 60000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONCLUDIS],
      companySlug: 'hwk-stuttgart',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
