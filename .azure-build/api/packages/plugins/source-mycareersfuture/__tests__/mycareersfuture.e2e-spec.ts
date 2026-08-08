/**
 * E2E test for the MyCareersFuture scraper.
 *
 * MyCareersFuture is a Singapore government-backed job portal
 * (mycareersfuture.gov.sg). Uses a public JSON API -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MycareersfutureModule, MycareersfutureService } from '@ever-jobs/source-mycareersfuture';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('MycareersfutureService (E2E)', () => {
  let service: MycareersfutureService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MycareersfutureModule],
    }).compile();
    service = module.get<MycareersfutureService>(MycareersfutureService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MYCAREERSFUTURE],
      searchTerm: 'developer',
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
      expect(job.site).toBe(Site.MYCAREERSFUTURE);
      expect(job.id).toMatch(/^mycareersfuture-/);
      expect(job.jobUrl).toBeDefined();
      expect(job.jobUrl).toContain('mycareersfuture.gov.sg/job/');
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MYCAREERSFUTURE],
      searchTerm: 'developer',
      resultsWanted: 3,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle keyword search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MYCAREERSFUTURE],
      searchTerm: 'developer',
      resultsWanted: 5,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should map salary information when available', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.MYCAREERSFUTURE],
      searchTerm: 'developer',
      resultsWanted: 20,
    });
    const response = await service.scrape(input);
    expect(response).toBeDefined();
    // Some jobs may have compensation
    const jobsWithPay = response.jobs.filter((j) => j.compensation != null);
    if (jobsWithPay.length > 0) {
      const comp = jobsWithPay[0].compensation!;
      expect(comp.interval).toBe('monthly');
      expect(
        comp.minAmount != null || comp.maxAmount != null,
      ).toBe(true);
    }
  }, 30000);
});
