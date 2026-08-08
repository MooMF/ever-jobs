/**
 * E2E test for the Occupop ATS scraper.
 *
 * No authentication required — Occupop careers sites are backed by a public
 * GraphQL gateway (`POST /graphql`, `LiveJobs` operation with the tenant's
 * `companyKey`). Tests run against a known Occupop-powered tenant but tolerate
 * upstream changes / live-role churn by treating zero results as acceptable;
 * the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OccupopModule, OccupopService } from '@ever-jobs/source-ats-occupop';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('OccupopService (E2E)', () => {
  let service: OccupopService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OccupopModule],
    }).compile();

    service = module.get<OccupopService>(OccupopService);
  });

  it('should return job results for a known Occupop tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OCCUPOP],
      companySlug: 'molloygroup',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.OCCUPOP);
      expect(job.atsType).toBe('occupop');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OCCUPOP],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OCCUPOP],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OCCUPOP],
      companySlug: 'molloygroup',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
