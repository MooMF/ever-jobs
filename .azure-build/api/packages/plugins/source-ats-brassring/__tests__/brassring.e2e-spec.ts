/**
 * E2E test for the BrassRing (IBM Kenexa) ATS scraper.
 *
 * No authentication required — BrassRing tenants publish a public candidate
 * "Talent Gateway" on the shared host `https://sjobs.brassring.com/`, addressed by
 * a `partnerid` + `siteid` pair. The jobs index is a client-rendered SPA, so the
 * adapter calls the portal's own AJAX search endpoint
 * (`POST /TgNewUI/Search/Ajax/MatchedJobs`) and enriches roles from each
 * server-rendered detail page's schema.org `JobPosting` JSON-LD when present. The
 * adapter resolves the tenant from a `companySlug` (the `partnerid:siteid` pair,
 * e.g. `25212:5164`) or a full `companyUrl`. Tests run against a known
 * BrassRing-powered tenant but tolerate upstream changes / empty feeds by treating
 * zero results as acceptable; the shape assertions only run when jobs are actually
 * returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BrassRingModule, BrassRingService } from '@ever-jobs/source-ats-brassring';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public BrassRing-powered Talent Gateway (AAFES — confirmed 2026-06-03).
const KNOWN_PARTNER_ID = '25212';
const KNOWN_SITE_ID = '5164';
const KNOWN_TENANT = `${KNOWN_PARTNER_ID}:${KNOWN_SITE_ID}`;

describe('BrassRingService (E2E)', () => {
  let service: BrassRingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BrassRingModule],
    }).compile();

    service = module.get<BrassRingService>(BrassRingService);
  });

  it('should return job results for a known BrassRing tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BRASSRING],
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
      expect(job.site).toBe(Site.BRASSRING);
      expect(job.atsType).toBe('brassring');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BRASSRING],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BRASSRING],
      companyUrl: `https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid=${KNOWN_PARTNER_ID}&siteid=${KNOWN_SITE_ID}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BRASSRING],
      companySlug: '999999:888888',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BRASSRING],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
