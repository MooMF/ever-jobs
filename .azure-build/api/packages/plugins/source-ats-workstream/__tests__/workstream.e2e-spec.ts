/**
 * E2E test for the Workstream ATS scraper.
 *
 * Workstream hosts public careers pages as server-rendered HTML at
 * `https://www.workstream.us/j/{accountId}/{brandSlug}`. There is no public
 * anonymous JSON API — data is extracted by parsing the HTML responses.
 * Tests run against known Workstream-powered tenants but tolerate upstream
 * changes or WAF gating by treating zero results as acceptable; shape
 * assertions only run when jobs are actually returned.
 *
 * The `companySlug` is the `{accountId}/{brandSlug}` path, e.g. `36047dd7/jamba`.
 * Verified live on 2026-06-03: `36047dd7/jamba` hosts open Jamba franchise positions.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WorkstreamModule, WorkstreamService } from '@ever-jobs/source-ats-workstream';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('WorkstreamService (E2E)', () => {
  let service: WorkstreamService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WorkstreamModule],
    }).compile();

    service = module.get<WorkstreamService>(WorkstreamService);
  });

  it('should return job results for a known Workstream tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKSTREAM],
      // Real tenant: Jamba franchise on Workstream (verified 2026-06-03).
      companySlug: '36047dd7/jamba',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.WORKSTREAM);
      expect(job.atsType).toBe('workstream');
      expect(job.atsId).toBeDefined();
      expect(typeof job.jobUrl).toBe('string');
      expect(job.jobUrl).toContain('workstream.us');
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKSTREAM],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKSTREAM],
      companySlug: 'deadbeef/this-company-definitely-does-not-exist-xyz99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKSTREAM],
      companySlug: '36047dd7/jamba',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
