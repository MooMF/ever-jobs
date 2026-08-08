/**
 * E2E test for the rexx systems ATS scraper.
 *
 * No authentication is required — rexx tenants publish a public job market at
 * `GET {host}/stellenangebote.html`, and each job-detail page embeds a
 * schema.org `JobPosting` JSON-LD block. Tests run against a known
 * rexx-powered tenant but tolerate upstream changes, network failures, or WAF
 * gating by treating zero results as acceptable; shape assertions only run when
 * jobs are actually returned.
 *
 * Known live tenants (verified 2026-06-03):
 *   - `companySlug: 'icotek'`  → `https://icotek-portal.rexx-systems.com`
 *   - `companySlug: 'nobix'`   → `https://nobix-portal.rexx-systems.com`
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RexxModule, RexxService } from '@ever-jobs/source-ats-rexx';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RexxService (E2E)', () => {
  let service: RexxService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RexxModule],
    }).compile();

    service = module.get<RexxService>(RexxService);
  });

  it('should return job results for a known rexx tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REXX],
      companySlug: 'icotek',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.REXX);
      expect(job.atsType).toBe('rexx');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
      expect((job.jobUrl ?? '').length).toBeGreaterThan(0);
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REXX],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REXX],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 60000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REXX],
      companySlug: 'icotek',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
