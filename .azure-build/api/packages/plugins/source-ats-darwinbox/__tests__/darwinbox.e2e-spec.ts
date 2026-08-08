/**
 * E2E test for the Darwinbox ATS scraper.
 *
 * No authentication required — Darwinbox tenants publish a public careers
 * portal (`https://{tenant}.darwinbox.in/ms/candidate/careers`), an Angular SPA
 * backed by the candidate API (`/ms/candidateapi/...`). The candidate backend
 * sits behind a Cloudflare bot gate, so anonymous calls may be challenged; the
 * adapter is designed to degrade to zero results in that case. Tests run
 * against a known Darwinbox-powered tenant but tolerate upstream changes / bot
 * challenges / empty tenants by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DarwinboxModule, DarwinboxService } from '@ever-jobs/source-ats-darwinbox';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Darwinbox-powered careers sub-domain (Darwinbox's own portal).
const KNOWN_TENANT = 'dbox';

describe('DarwinboxService (E2E)', () => {
  let service: DarwinboxService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DarwinboxModule],
    }).compile();

    service = module.get<DarwinboxService>(DarwinboxService);
  });

  it('should return job results for a known Darwinbox tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DARWINBOX],
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
      expect(job.site).toBe(Site.DARWINBOX);
      expect(job.atsType).toBe('darwinbox');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DARWINBOX],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DARWINBOX],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DARWINBOX],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
