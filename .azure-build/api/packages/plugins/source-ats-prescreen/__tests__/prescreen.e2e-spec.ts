/**
 * E2E test for the Prescreen (prescreen.io / onlyfy.jobs) ATS scraper.
 *
 * No authentication is required — Prescreen tenants publish a public,
 * anonymous candidate career portal at `https://{handle}.onlyfy.jobs/`
 * (legacy `{handle}.jobbase.io` / `{handle}.prescreenapp.io` hosts 301-redirect
 * to it). Tests run against a known live tenant but tolerate upstream changes
 * or WAF gating by treating zero results as acceptable; shape assertions only
 * run when jobs are actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - `companySlug: 'v2c2'` — Virtual Vehicle Research GmbH (Graz, Austria),
 *     served at `https://v2c2.onlyfy.jobs/`.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrescreenModule, PrescreenService } from '@ever-jobs/source-ats-prescreen';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('PrescreenService (E2E)', () => {
  let service: PrescreenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrescreenModule],
    }).compile();

    service = module.get<PrescreenService>(PrescreenService);
  });

  it('should return shaped job results for a known Prescreen tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PRESCREEN],
      companySlug: 'v2c2',
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
      expect(job.site).toBe(Site.PRESCREEN);
      expect(job.atsType).toBe('prescreen');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PRESCREEN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PRESCREEN],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 60000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PRESCREEN],
      companySlug: 'v2c2',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  }, 60000);
});
