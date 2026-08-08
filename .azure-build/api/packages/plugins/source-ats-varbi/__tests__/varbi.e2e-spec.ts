/**
 * E2E test for the Varbi ATS scraper.
 *
 * No authentication required — Varbi (varbi.com, Sweden) exposes a public,
 * server-rendered career page per tenant
 * (`GET https://{tenant}.varbi.com/en/`) that lists every open role, each
 * linking to a public job-ad page (`…/what:job/jobID:{jobID}/`). The adapter
 * resolves the tenant from `companySlug` (the sub-domain label). Tests run
 * against a known Varbi-powered tenant but tolerate upstream changes / empty
 * tenants by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { VarbiModule, VarbiService } from '@ever-jobs/source-ats-varbi';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Varbi-powered career sub-domain (KTH Royal Institute of Technology).
const KNOWN_TENANT = 'kth';

describe('VarbiService (E2E)', () => {
  let service: VarbiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VarbiModule],
    }).compile();

    service = module.get<VarbiService>(VarbiService);
  });

  it('should return job results for a known Varbi tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VARBI],
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
      expect(job.site).toBe(Site.VARBI);
      expect(job.atsType).toBe('varbi');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VARBI],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VARBI],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VARBI],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should resolve a tenant from companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VARBI],
      companyUrl: `https://${KNOWN_TENANT}.varbi.com/en/`,
      resultsWanted: 2,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
