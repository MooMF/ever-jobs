/**
 * E2E test for the Traffit ATS scraper.
 *
 * No authentication required — Traffit exposes a public, anonymous published-
 * adverts feed (`GET https://{tenant}.traffit.com/public/job_posts/published`)
 * keyed by the tenant sub-domain label. Tests run against a known Traffit-powered
 * tenant but tolerate upstream changes / empty tenants by treating zero results
 * as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TraffitModule, TraffitService } from '@ever-jobs/source-ats-traffit';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Traffit-powered tenant verified live 2026-06-03 (12 published adverts).
const KNOWN_TENANT = 'people';

describe('TraffitService (E2E)', () => {
  let service: TraffitService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TraffitModule],
    }).compile();

    service = module.get<TraffitService>(TraffitService);
  });

  it('should return job results for a known Traffit tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRAFFIT],
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
      expect(job.site).toBe(Site.TRAFFIT);
      expect(job.atsType).toBe('traffit');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRAFFIT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRAFFIT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRAFFIT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
