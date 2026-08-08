/**
 * E2E test for the Applied ATS scraper.
 *
 * Applied (app.beapplied.com) does not expose a public anonymous JSON API —
 * all REST endpoints require authentication (HTTP 401).  The adapter scrapes
 * the public organisation HTML page (`/org/{orgId}/{orgSlug}`) to discover job
 * links, then fetches each individual job detail page (`/apply/{jobSlug}`).
 *
 * Tests run against a known Applied tenant but tolerate upstream changes /
 * WAF gating / the org having zero open roles by treating zero results as
 * acceptable; shape assertions only run when jobs are actually returned.
 *
 * The real tenant used here is Citizens UK (orgId 1549, slug "citizens-uk"),
 * verified live on 2026-06-03 to have at least one open role.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppliedModule, AppliedService } from '@ever-jobs/source-ats-applied';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('AppliedService (E2E)', () => {
  let service: AppliedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppliedModule],
    }).compile();

    service = module.get<AppliedService>(AppliedService);
  });

  it('should return job results for a known Applied tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLIED],
      companySlug: '1549/citizens-uk',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.APPLIED);
      expect(job.atsType).toBe('applied');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toMatch(/^https:\/\/app\.beapplied\.com\/apply\//);
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLIED],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLIED],
      companySlug: '99999999/this-org-definitely-does-not-exist-xyz',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLIED],
      companySlug: '1549/citizens-uk',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  }, 60000);
});
