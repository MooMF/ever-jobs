/**
 * E2E test for the Ceipal ATS scraper.
 *
 * No authentication is required — Ceipal tenants publish a public career
 * portal whose reference client fetches an anonymous JSON API keyed only by a
 * career-portal API key carried in the URL path:
 *
 *   GET https://api.ceipal.com/{apiKey}/job-postings/?page={n}
 *
 * Tests run against a known Ceipal-powered tenant but tolerate upstream changes
 * (key rotation, tenant migration, WAF gating) by treating zero results as
 * acceptable; shape assertions only run when jobs are actually returned.
 *
 * Known live tenant used for testing:
 *   - `companyUrl: 'https://joblist.smartdata.net'` — a real Ceipal career
 *     portal (".:: CEIPAL Career Portal ::."). The portal config publishes the
 *     anonymous career-portal API key below.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CeipalModule, CeipalService } from '@ever-jobs/source-ats-ceipal';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public career-portal API key for the known live tenant (carried in the URL
// path by the tenant's own portal config — not a secret credential).
const KNOWN_TENANT_KEY = '3995185f44a203a8b1d17645bdc14f12634140cabad370d240';

describe('CeipalService (E2E)', () => {
  let service: CeipalService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CeipalModule],
    }).compile();

    service = module.get<CeipalService>(CeipalService);
  });

  it('should return shaped job results for a known Ceipal tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEIPAL],
      companySlug: KNOWN_TENANT_KEY,
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
      expect(job.site).toBe(Site.CEIPAL);
      expect(job.atsType).toBe('ceipal');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEIPAL],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEIPAL],
      companySlug: 'this-tenant-key-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CEIPAL],
      companyUrl: `https://api.ceipal.com/${KNOWN_TENANT_KEY}/`,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
