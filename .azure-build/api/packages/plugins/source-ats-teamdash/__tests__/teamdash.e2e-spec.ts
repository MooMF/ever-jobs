/**
 * E2E test for the Teamdash ATS scraper.
 *
 * No authentication is required — Teamdash renders every public career page
 * and job posting as a server-side "landing" whose full state is embedded in
 * the page HTML as a `window.context = { ... }` JSON blob. The scraper reads
 * `career_page_feed_contents` for the listing and fans out to each posting's
 * landing for the description. Tests run against a known live Teamdash tenant
 * but tolerate upstream changes or bot-gating by treating zero results as
 * acceptable; shape assertions only run when jobs are actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - companyUrl: 'https://cr14.teamdash.com/p/job/20eH77Ul/career-page'
 *     (CR14, an Estonian cyber-range team — 2 open roles in Tallinn)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TeamdashModule, TeamdashService } from '@ever-jobs/source-ats-teamdash';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const KNOWN_TENANT_CAREER_URL =
  'https://cr14.teamdash.com/p/job/20eH77Ul/career-page';

describe('TeamdashService (E2E)', () => {
  let service: TeamdashService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TeamdashModule],
    }).compile();

    service = module.get<TeamdashService>(TeamdashService);
  });

  it('should return job results for a known Teamdash tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEAMDASH],
      companyUrl: KNOWN_TENANT_CAREER_URL,
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
      expect(job.site).toBe(Site.TEAMDASH);
      expect(job.atsType).toBe('teamdash');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 45000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEAMDASH],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEAMDASH],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 45000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEAMDASH],
      companyUrl: KNOWN_TENANT_CAREER_URL,
      resultsWanted: 1,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(1);
  }, 45000);
});
