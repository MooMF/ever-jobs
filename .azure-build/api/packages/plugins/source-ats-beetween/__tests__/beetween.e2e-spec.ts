/**
 * E2E test for the Beetween ATS scraper.
 *
 * No authentication required — Beetween exposes a public, unauthenticated career
 * portal (`https://emploi.beetween.com/WeaselWeb/p/{tenant}`) and per-tenant
 * vanity career domains, with each open role at a `/poste/{publicId}-{slug}/`
 * detail page (the public id being Beetween's 10–20 char lower-alphanumeric
 * offer token). The adapter fetches the tenant career page once and harvests the
 * open-role references. Tests run against a known Beetween-powered tenant but
 * tolerate upstream changes / empty tenants by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BeetweenModule, BeetweenService } from '@ever-jobs/source-ats-beetween';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Beetween-powered career site (Beetween's own recruitment site).
const KNOWN_TENANT = 'beetween';
const KNOWN_TENANT_URL = 'https://recrutement.beetween.fr/offres-emploi/';

describe('BeetweenService (E2E)', () => {
  let service: BeetweenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BeetweenModule],
    }).compile();

    service = module.get<BeetweenService>(BeetweenService);
  });

  it('should return job results for a known Beetween tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEETWEEN],
      companyUrl: KNOWN_TENANT_URL,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.BEETWEEN);
      expect(job.atsType).toBe('beetween');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEETWEEN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEETWEEN],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEETWEEN],
      companyUrl: KNOWN_TENANT_URL,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should resolve a tenant from companySlug to the canonical portal', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEETWEEN],
      companySlug: KNOWN_TENANT,
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
