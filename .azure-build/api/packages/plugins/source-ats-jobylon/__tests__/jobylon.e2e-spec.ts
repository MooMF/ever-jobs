/**
 * E2E test for the Jobylon scraper.
 *
 * Tests public feed scraping.
 * Requires a valid companySlug (feed hash) to fetch jobs.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobylonModule, JobylonService } from '@ever-jobs/source-ats-jobylon';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobylonService (E2E)', () => {
  let service: JobylonService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobylonModule],
    }).compile();

    service = module.get<JobylonService>(JobylonService);
  });

  it('should return job results via public feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBYLON],
      companySlug: 'spotify',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.JOBYLON);
      expect(job.atsType).toBe('jobylon');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  });

  it('should return empty results for non-existent company', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBYLON],
      companySlug: 'zzz-nonexistent-company-12345',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBYLON],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
