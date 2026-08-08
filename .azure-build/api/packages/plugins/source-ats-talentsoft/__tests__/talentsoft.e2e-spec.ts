/**
 * E2E test for the Talentsoft ATS scraper.
 *
 * No authentication required — Talentsoft tenants publish a public RSS offer
 * export (`GET https://{tenant}-recrute.talent-soft.com/handlers/offerRss.ashx?LCID=1036`)
 * that lists every open role for the tenant. The adapter resolves the career
 * host from a `companySlug` (the sub-domain label, e.g. `elis`) or a full
 * `companyUrl`. Tests run against a known Talentsoft-powered tenant but tolerate
 * upstream changes / empty feeds by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TalentsoftModule, TalentsoftService } from '@ever-jobs/source-ats-talentsoft';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Talentsoft-powered careers sub-domain (Elis — verified live 2026-06-03).
const KNOWN_TENANT = 'elis';

describe('TalentsoftService (E2E)', () => {
  let service: TalentsoftService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TalentsoftModule],
    }).compile();

    service = module.get<TalentsoftService>(TalentsoftService);
  });

  it('should return job results for a known Talentsoft tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTSOFT],
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
      expect(job.site).toBe(Site.TALENTSOFT);
      expect(job.atsType).toBe('talentsoft');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTSOFT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTSOFT],
      companyUrl: `https://${KNOWN_TENANT}-recrute.talent-soft.com/offre-de-emploi/liste-offres.aspx`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTSOFT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTSOFT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
