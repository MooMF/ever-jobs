/**
 * E2E test for the JobAdder ATS scraper.
 *
 * No authentication required — JobAdder hosts each tenant's public Careerpage
 * at `https://clientapps.jobadder.com/{accountId}/{slug}` (server-rendered HTML
 * that the scraper parses). Tests run against a known JobAdder-powered tenant
 * but tolerate upstream changes / WAF gating by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobAdderModule, JobAdderService } from '@ever-jobs/source-ats-jobadder';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobAdderService (E2E)', () => {
  let service: JobAdderService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobAdderModule],
    }).compile();

    service = module.get<JobAdderService>(JobAdderService);
  });

  it('should return job results for a known JobAdder tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBADDER],
      companySlug: '84381/eq8-recruit',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.JOBADDER);
      expect(job.atsType).toBe('jobadder');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBADDER],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBADDER],
      companySlug: '99999999/this-tenant-definitely-does-not-exist-xyz',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBADDER],
      companySlug: '84381/eq8-recruit',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  }, 30000);
});
