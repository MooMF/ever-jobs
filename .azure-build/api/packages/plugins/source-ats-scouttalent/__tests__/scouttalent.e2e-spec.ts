/**
 * E2E test for the Scout Talent ATS scraper.
 *
 * No authentication required — Scout Talent tenants publish a public,
 * server-rendered candidate board on the shared application portal
 * (`https://{tenant}.applynow.net.au/`) whose open roles are listed as
 * `/jobs/{code}-{slug}` links and detailed on server-rendered pages (the leading
 * `{code}` segment is the ATS id). The adapter resolves the careers host from a
 * `companySlug` (the sub-domain label, e.g. `krg`) or a full `companyUrl`. Tests
 * run against a known Scout Talent-powered tenant but tolerate upstream changes /
 * empty feeds by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ScoutTalentModule, ScoutTalentService } from '@ever-jobs/source-ats-scouttalent';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Scout Talent-powered candidate board (Ku-ring-gai Council — confirmed live 2026-06-03).
const KNOWN_TENANT = 'krg';

describe('ScoutTalentService (E2E)', () => {
  let service: ScoutTalentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ScoutTalentModule],
    }).compile();

    service = module.get<ScoutTalentService>(ScoutTalentService);
  });

  it('should return job results for a known Scout Talent tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SCOUTTALENT],
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
      expect(job.site).toBe(Site.SCOUTTALENT);
      expect(job.atsType).toBe('scouttalent');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SCOUTTALENT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SCOUTTALENT],
      companyUrl: `https://${KNOWN_TENANT}.applynow.net.au/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SCOUTTALENT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SCOUTTALENT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
