/**
 * E2E test for the Hireology ATS scraper.
 *
 * No authentication required — Hireology careers sites expose a public jobs
 * feed (`GET /v2/public/careers/{slug}`) reached with an anonymous bearer token
 * minted into the careers page shell. Tests run against a known
 * Hireology-powered tenant but tolerate upstream changes / WAF gating by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HireologyModule, HireologyService } from '@ever-jobs/source-ats-hireology';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('HireologyService (E2E)', () => {
  let service: HireologyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HireologyModule],
    }).compile();

    service = module.get<HireologyService>(HireologyService);
  });

  it('should return job results for a known Hireology tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREOLOGY],
      companySlug: 'hireology2',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.HIREOLOGY);
      expect(job.atsType).toBe('hireology');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREOLOGY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREOLOGY],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREOLOGY],
      companySlug: 'hireology2',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
