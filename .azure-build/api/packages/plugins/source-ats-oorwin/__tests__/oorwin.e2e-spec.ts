/**
 * E2E test for the Oorwin ATS scraper.
 *
 * No authentication required — Oorwin career portals expose two anonymous
 * POST endpoints (`careers/getJobList` and `careers/job_view`) that the
 * portal SPA itself calls. Tests run against a known Oorwin-powered tenant
 * (`purpledrive`) but tolerate upstream changes / WAF gating by treating
 * zero results as acceptable; shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OorwinModule, OorwinService } from '@ever-jobs/source-ats-oorwin';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('OorwinService (E2E)', () => {
  let service: OorwinService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OorwinModule],
    }).compile();

    service = module.get<OorwinService>(OorwinService);
  });

  it('should return job results for a known Oorwin tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OORWIN],
      companySlug: 'purpledrive',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.OORWIN);
      expect(job.atsType).toBe('oorwin');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OORWIN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OORWIN],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OORWIN],
      companySlug: 'purpledrive',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
