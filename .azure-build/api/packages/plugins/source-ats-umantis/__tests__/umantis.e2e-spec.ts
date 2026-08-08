/**
 * E2E test for the Umantis (Haufe Talent) ATS scraper.
 *
 * No authentication required — Umantis (Haufe Group's e-recruiting product) tenants
 * publish a public, server-rendered candidate-facing job board on the shared host
 * `https://recruitingapp-{tenantId}.umantis.com/Jobs/All` (and a `.de.umantis.com`
 * variant). The board lists each open role as a canonical vacancy anchor
 * (`/Vacancies/{ID}/Description/{langCode}`), and the adapter fetches each role's
 * detail page for the title / location / date / body. The adapter resolves the
 * tenant from a `companySlug` (the numeric tenant id, optionally `{id}.de`, e.g.
 * `5476.de`) or a full `companyUrl`. Tests run against a known Umantis-powered tenant
 * but tolerate upstream changes / empty feeds by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { UmantisModule, UmantisService } from '@ever-jobs/source-ats-umantis';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Umantis-powered board (ASMPT, on recruitingapp-5476.de.umantis.com —
// confirmed live 2026-06-03). The `.de` suffix selects the German host variant.
const KNOWN_TENANT = '5476.de';

describe('UmantisService (E2E)', () => {
  let service: UmantisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UmantisModule],
    }).compile();

    service = module.get<UmantisService>(UmantisService);
  });

  it('should return job results for a known Umantis tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.UMANTIS],
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
      expect(job.site).toBe(Site.UMANTIS);
      expect(job.atsType).toBe('umantis');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.UMANTIS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.UMANTIS],
      companyUrl: `https://recruitingapp-5476.de.umantis.com/Jobs/All?lang=eng`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.UMANTIS],
      companySlug: '99999999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.UMANTIS],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
