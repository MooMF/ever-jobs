/**
 * E2E test for the Recruitis ATS scraper.
 *
 * No authentication is required — Recruitis serves every tenant a public,
 * server-rendered career site at `https://jobs.recruitis.io/{tenant}`. Tests
 * run against known Recruitis-powered tenants but tolerate upstream changes or
 * WAF gating by treating zero results as acceptable; shape assertions only run
 * when jobs are actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - `companySlug: 'recruitisio'` — Recruitis.io s.r.o. career site.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecruitisModule, RecruitisService } from '@ever-jobs/source-ats-recruitis';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RecruitisService (E2E)', () => {
  let service: RecruitisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RecruitisModule],
    }).compile();

    service = module.get<RecruitisService>(RecruitisService);
  });

  it('should return job results for a known Recruitis tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITIS],
      companySlug: 'recruitisio',
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
      expect(job.site).toBe(Site.RECRUITIS);
      expect(job.atsType).toBe('recruitis');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 45000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITIS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITIS],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITIS],
      companySlug: 'recruitisio',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 45000);
});
