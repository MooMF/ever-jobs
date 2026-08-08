/**
 * E2E test for the Avionté (AviontéBOLD) ATS scraper.
 *
 * No authentication required — Avionté builds publish a public RSS/XML job
 * export (`GET https://www.myavionte.com/buildjobs_rss.aspx?compid={buildId}`)
 * that lists every posted job for the build. The adapter resolves the build id
 * from a `companySlug` (used as the `compid`) or a `companyUrl` (a feed URL or a
 * `*.aviontego.com` portal URL / `?CompanyID=` query). Tests run against a known
 * AviontéBOLD-powered tenant slug but tolerate upstream changes / empty feeds by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AvionteModule, AvionteService } from '@ever-jobs/source-ats-avionte';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public AviontéBOLD-powered tenant build (Meador Staffing Services — confirmed
// live on the `mdr.aviontego.com` portal host, 2026-06-03).
const KNOWN_TENANT = 'mdr';

describe('AvionteService (E2E)', () => {
  let service: AvionteService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AvionteModule],
    }).compile();

    service = module.get<AvionteService>(AvionteService);
  });

  it('should return job results for a known Avionté tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AVIONTE],
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
      expect(job.site).toBe(Site.AVIONTE);
      expect(job.atsType).toBe('avionte');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AVIONTE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a build from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AVIONTE],
      companyUrl: `https://${KNOWN_TENANT}.aviontego.com/portals/Portals/JobBoard/JobSearch.aspx?CompanyID=${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AVIONTE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AVIONTE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
