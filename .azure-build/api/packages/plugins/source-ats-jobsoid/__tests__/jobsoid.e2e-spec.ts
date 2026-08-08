/**
 * E2E test for the Jobsoid ATS scraper.
 *
 * No authentication is required — Jobsoid careers portals expose a public JSON
 * jobs feed (`GET https://{tenant}.jobsoid.com/api/v1/jobs`) returning a flat
 * array of full job records. Tests run against a known Jobsoid-powered tenant
 * but tolerate upstream changes or roles closing by treating zero results as
 * acceptable; shape assertions only run when jobs are actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - `companySlug: 'simpler'` → https://simpler.jobsoid.com
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobsoidModule, JobsoidService } from '@ever-jobs/source-ats-jobsoid';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobsoidService (E2E)', () => {
  let service: JobsoidService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobsoidModule],
    }).compile();

    service = module.get<JobsoidService>(JobsoidService);
  });

  it('should return job results for a known Jobsoid tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSOID],
      companySlug: 'simpler',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.JOBSOID);
      expect(job.atsType).toBe('jobsoid');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSOID],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSOID],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSOID],
      companyUrl: 'https://simpler.jobsoid.com',
      resultsWanted: 1,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(1);
  }, 30000);
});
