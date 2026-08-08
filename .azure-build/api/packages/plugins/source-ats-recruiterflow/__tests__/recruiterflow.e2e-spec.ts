/**
 * E2E test for the Recruiterflow scraper.
 *
 * Tests ATS scraping (requires companySlug as API key).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecruiterflowModule, RecruiterflowService } from '@ever-jobs/source-ats-recruiterflow';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RecruiterflowService (E2E)', () => {
  let service: RecruiterflowService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RecruiterflowModule],
    }).compile();

    service = module.get<RecruiterflowService>(RecruiterflowService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITERFLOW],
      companySlug: 'test-company',
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
      expect(job.site).toBe(Site.RECRUITERFLOW);
      expect(job.atsType).toBe('recruiterflow');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITERFLOW],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITERFLOW],
      companySlug: 'test-company',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });
});
