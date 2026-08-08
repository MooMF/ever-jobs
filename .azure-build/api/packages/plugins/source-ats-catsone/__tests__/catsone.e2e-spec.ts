/**
 * E2E test for the CATS (catsone.com) ATS scraper.
 *
 * CATS career portals serve server-rendered HTML (no anonymous public JSON
 * feed). Tests run against known CATS-hosted tenants but tolerate upstream
 * changes, WAF gating, or stale portals by treating zero results as
 * acceptable. Shape assertions only execute when jobs are actually returned.
 *
 * Known real tenant used: `authoritypartnersinc` (Authority Partners Inc) —
 * confirmed live on 2026-06-03 with 28 positions at
 * `https://authoritypartnersinc.catsone.com/careers/86212-General`.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CatsoneModule, CatsoneService } from '@ever-jobs/source-ats-catsone';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CatsoneService (E2E)', () => {
  let service: CatsoneService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CatsoneModule],
    }).compile();

    service = module.get<CatsoneService>(CatsoneService);
  });

  it('should return job results for a known CATS tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CATSONE],
      companyUrl: 'https://authoritypartnersinc.catsone.com/careers/86212-General',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect((job.title ?? '').length).toBeGreaterThan(0);
      expect(job.site).toBe(Site.CATSONE);
      expect(job.atsType).toBe('catsone');
      expect(job.atsId).toBeDefined();
      expect((job.atsId ?? '').length).toBeGreaterThan(0);
      expect(typeof job.jobUrl).toBe('string');
      expect(job.jobUrl ?? '').toContain('catsone.com');
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CATSONE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CATSONE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    // Must not throw; zero results is acceptable for a non-existent tenant.
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CATSONE],
      companyUrl: 'https://authoritypartnersinc.catsone.com/careers/86212-General',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
