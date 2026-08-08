/**
 * E2E test for the PCRecruiter ATS public job board scraper.
 *
 * No authentication is required — PCRecruiter customer databases expose an
 * anonymous job board at `https://www2.pcrecruiter.net/pcrbin/jobboard.aspx`,
 * addressable by a human-readable `uid` (`{Display Name}.{databasename}`).
 * Tests run against a known live tenant but tolerate upstream changes or WAF
 * gating by treating zero results as acceptable; shape assertions only run when
 * jobs are actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - `companySlug: 'alliance staffing.alliancestaffing'` — a US staffing
 *     agency board with ~38 open roles across 2 pages.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PCRecruiterModule, PCRecruiterService } from '@ever-jobs/source-ats-pcrecruiter';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const KNOWN_TENANT_UID = 'alliance staffing.alliancestaffing';

describe('PCRecruiterService (E2E)', () => {
  let service: PCRecruiterService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PCRecruiterModule],
    }).compile();

    service = module.get<PCRecruiterService>(PCRecruiterService);
  });

  it('should return shaped job results for a known PCRecruiter tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PCRECRUITER],
      companySlug: KNOWN_TENANT_UID,
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
      expect(job.site).toBe(Site.PCRECRUITER);
      expect(job.atsType).toBe('pcrecruiter');
      expect(job.atsId).toBeDefined();
      expect((job.atsId ?? '').length).toBeGreaterThan(0);
      expect(job.jobUrl).toBeDefined();
      expect((job.jobUrl ?? '').length).toBeGreaterThan(0);
      expect(job.id).toBe(`pcrecruiter-${job.atsId}`);
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PCRECRUITER],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PCRECRUITER],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999.nodbxyz99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 60000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PCRECRUITER],
      companySlug: KNOWN_TENANT_UID,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
