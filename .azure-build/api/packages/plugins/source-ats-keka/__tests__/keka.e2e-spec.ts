/**
 * E2E test for the Keka ATS scraper.
 *
 * No authentication required — Keka tenants publish a public candidate career
 * site on their own sub-domain (`https://{tenant}.keka.com/careers/`) whose open
 * roles are loaded over a public published-jobs JSON feed, with each role also
 * detailed on a server-rendered page (`/careers/jobdetails/{jobId}`) carrying
 * schema.org `JobPosting` JSON-LD. The adapter resolves the careers host from a
 * `companySlug` (the sub-domain label, e.g. `algoworks`) or a full `companyUrl`.
 * Tests run against a known Keka-powered tenant but tolerate upstream changes /
 * empty feeds by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { KekaModule, KekaService } from '@ever-jobs/source-ats-keka';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Keka-powered candidate career site (Algoworks — confirmed 2026-06-03).
const KNOWN_TENANT = 'algoworks';

describe('KekaService (E2E)', () => {
  let service: KekaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [KekaModule],
    }).compile();

    service = module.get<KekaService>(KekaService);
  });

  it('should return job results for a known Keka tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KEKA],
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
      expect(job.site).toBe(Site.KEKA);
      expect(job.atsType).toBe('keka');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KEKA],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KEKA],
      companyUrl: `https://${KNOWN_TENANT}.keka.com/careers/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KEKA],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KEKA],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
