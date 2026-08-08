/**
 * E2E test for the ReachMee (Talentech) ATS scraper.
 *
 * No authentication required — ReachMee installations publish a public RSS
 * vacancy export
 * (`GET https://site{NNN}.reachmee.com/Public/rssfeed/external.ashx?id={siteId}&InstallationID={installationId}&CustomerName={customer}&lang={lang}`)
 * that lists every open role for the installation. The adapter resolves the
 * installation coordinates from a structured `companySlug`
 * (`{customer}@{installationId}:{siteId}#site{NNN}`, e.g. `oru@I003:12#site106`)
 * or from a full ReachMee `companyUrl`. Tests run against a known ReachMee-powered
 * installation (Örebro University) but tolerate upstream changes / empty feeds by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ReachMeeModule, ReachMeeService } from '@ever-jobs/source-ats-reachmee';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public ReachMee-powered installation (Örebro University — verified live 2026-06-03).
const KNOWN_TENANT = 'oru@I003:12#site106';
const KNOWN_FEED_URL =
  'https://site106.reachmee.com/Public/rssfeed/external.ashx?id=12&InstallationID=I003&CustomerName=oru&lang=UK';

describe('ReachMeeService (E2E)', () => {
  let service: ReachMeeService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ReachMeeModule],
    }).compile();

    service = module.get<ReachMeeService>(ReachMeeService);
  });

  it('should return job results for a known ReachMee tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REACHMEE],
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
      expect(job.site).toBe(Site.REACHMEE);
      expect(job.atsType).toBe('reachmee');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REACHMEE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve an installation from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REACHMEE],
      companyUrl: KNOWN_FEED_URL,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REACHMEE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz@I999:99999#site199',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.REACHMEE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
