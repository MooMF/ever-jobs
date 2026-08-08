/**
 * E2E test for the Crelate scraper.
 *
 * Tests ATS scraping (requires companySlug as API key).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CrelateModule, CrelateService } from '@ever-jobs/source-ats-crelate';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CrelateService (E2E)', () => {
  let service: CrelateService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CrelateModule],
    }).compile();

    service = module.get<CrelateService>(CrelateService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRELATE],
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
      expect(job.site).toBe(Site.CRELATE);
      expect(job.atsType).toBe('crelate');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRELATE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CRELATE],
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
