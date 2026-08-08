/**
 * E2E test for the d.vinci ATS scraper.
 *
 * No authentication required — d.vinci exposes the vendor's documented public
 * Job Publication REST API (`GET /jobPublication/list.json`) on each tenant's
 * careers-portal sub-domain (`{slug}.dvinci-hr.com`). The endpoint is "always
 * public" (no auth, API key, or cookie). Tests run against a known
 * d.vinci-powered tenant but tolerate upstream changes / empty tenants by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DvinciModule, DvinciService } from '@ever-jobs/source-ats-dvinci';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public d.vinci tenant verified live 2026-06-03 (60 active publications).
const KNOWN_TENANT_SLUG = 'inverto';

describe('DvinciService (E2E)', () => {
  let service: DvinciService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DvinciModule],
    }).compile();

    service = module.get<DvinciService>(DvinciService);
  });

  it('should return job results for a known d.vinci tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DVINCI],
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
      expect(job.site).toBe(Site.DVINCI);
      expect(job.atsType).toBe('dvinci');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should resolve a tenant from a companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DVINCI],
      companyUrl: `https://${KNOWN_TENANT_SLUG}.dvinci-hr.com/en/jobs`,
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DVINCI],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DVINCI],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DVINCI],
      companySlug: KNOWN_TENANT_SLUG,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
