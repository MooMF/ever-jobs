/**
 * E2E test for the TrackerRMS (tracker-rms.com) ATS scraper.
 *
 * No authentication required — TrackerRMS tenants publish their open roles through
 * the "Publish Jobs to your Website" / "Jobs+" integration on the shared regional
 * EVO Portal host, an unauthenticated HTML feed keyed by the tenant's TrackerRMS
 * database name:
 *
 *   https://evoportal{us|uk|ca}.tracker-rms.com/{database}/jobs?fields={csv}
 *
 * The adapter resolves the tenant from a `companySlug` (the database name, e.g.
 * `Tracker_PrecisionResources`) or a full `companyUrl` (an EVO Portal feed/apply
 * URL). Tests run against a known TrackerRMS-powered tenant but tolerate upstream
 * changes / empty feeds by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TrackerRmsModule, TrackerRmsService } from '@ever-jobs/source-ats-trackerrms';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public TrackerRMS-powered tenant (Precision Resources — US staffing firm, observed live 2026-06-03).
const KNOWN_TENANT = 'Tracker_PrecisionResources';

describe('TrackerRmsService (E2E)', () => {
  let service: TrackerRmsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrackerRmsModule],
    }).compile();

    service = module.get<TrackerRmsService>(TrackerRmsService);
  });

  it('should return job results for a known TrackerRMS tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRACKERRMS],
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
      expect(job.site).toBe(Site.TRACKERRMS);
      expect(job.atsType).toBe('trackerrms');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRACKERRMS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRACKERRMS],
      companyUrl: `https://evoportalus.tracker-rms.com/${KNOWN_TENANT}/jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRACKERRMS],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TRACKERRMS],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
