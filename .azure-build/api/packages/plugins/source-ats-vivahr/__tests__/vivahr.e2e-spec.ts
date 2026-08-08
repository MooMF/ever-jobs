/**
 * E2E test for the VivaHR ATS scraper.
 *
 * No authentication required — VivaHR careers sites are public, server-rendered
 * HTML hosted under `https://jobs.avahr.com/{tenant}/jobs`, with each role's
 * detail page embedding a schema.org `JobPosting` JSON-LD block. Tests run
 * against a known VivaHR-powered tenant but tolerate upstream changes / WAF
 * gating by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { VivaHRModule, VivaHRService } from '@ever-jobs/source-ats-vivahr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('VivaHRService (E2E)', () => {
  let service: VivaHRService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VivaHRModule],
    }).compile();

    service = module.get<VivaHRService>(VivaHRService);
  });

  it('should return job results for a known VivaHR tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIVAHR],
      companySlug: '236-avahr',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.VIVAHR);
      expect(job.atsType).toBe('vivahr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIVAHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIVAHR],
      companySlug: '99999999-this-tenant-definitely-does-not-exist-xyz',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 60000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIVAHR],
      companySlug: '236-avahr',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  }, 60000);
});
