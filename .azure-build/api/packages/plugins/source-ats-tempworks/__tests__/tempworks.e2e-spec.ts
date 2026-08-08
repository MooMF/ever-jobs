/**
 * E2E test for the TempWorks Job Board ATS scraper.
 *
 * No authentication required — TempWorks staffing tenants publish a public
 * candidate Job Board on the shared host
 * `https://jobboard.ontempworks.com/{tenant}` whose open orders are enumerated by
 * a server-rendered listing page (`/{tenant}/Jobs/Search`) and detailed on
 * server-rendered pages (`/{tenant}/Jobs/Details/{orderId}`) that carry an
 * HRCenter "Apply with Us" link. The adapter resolves the tenant from a
 * `companySlug` (the board id, e.g. `JustInTimeStaffing`) or a full `companyUrl`.
 * Tests run against a known TempWorks-powered tenant but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TempWorksModule, TempWorksService } from '@ever-jobs/source-ats-tempworks';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public TempWorks-powered candidate board (Just In Time Staffing — confirmed 2026-06-03).
const KNOWN_TENANT = 'JustInTimeStaffing';

describe('TempWorksService (E2E)', () => {
  let service: TempWorksService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TempWorksModule],
    }).compile();

    service = module.get<TempWorksService>(TempWorksService);
  });

  it('should return job results for a known TempWorks tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEMPWORKS],
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
      expect(job.site).toBe(Site.TEMPWORKS);
      expect(job.atsType).toBe('tempworks');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEMPWORKS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEMPWORKS],
      companyUrl: `https://jobboard.ontempworks.com/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEMPWORKS],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TEMPWORKS],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
