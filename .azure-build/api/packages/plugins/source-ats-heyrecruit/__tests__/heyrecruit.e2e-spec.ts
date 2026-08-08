/**
 * E2E test for the Heyrecruit ATS scraper.
 *
 * No authentication required — Heyrecruit serves each tenant's open roles from a
 * public, server-rendered careers portal at
 * `https://{subdomain}.heyrecruit.de/?page=jobs`, where every job tile embeds the
 * full job record in an inline `jobClickEventListener({...})` handler. Tests run
 * against a known Heyrecruit-powered tenant but tolerate upstream changes / empty
 * tenants by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HeyrecruitModule, HeyrecruitService } from '@ever-jobs/source-ats-heyrecruit';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Heyrecruit-powered tenant verified live 2026-06-03
// (Bodensee-Therme Überlingen — bodenseetherme.heyrecruit.de).
const KNOWN_TENANT_SLUG = 'bodenseetherme';

describe('HeyrecruitService (E2E)', () => {
  let service: HeyrecruitService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HeyrecruitModule],
    }).compile();

    service = module.get<HeyrecruitService>(HeyrecruitService);
  });

  it('should return job results for a known Heyrecruit tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HEYRECRUIT],
      companySlug: KNOWN_TENANT_SLUG,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.HEYRECRUIT);
      expect(job.atsType).toBe('heyrecruit');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HEYRECRUIT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HEYRECRUIT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HEYRECRUIT],
      companySlug: KNOWN_TENANT_SLUG,
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  }, 30000);
});
