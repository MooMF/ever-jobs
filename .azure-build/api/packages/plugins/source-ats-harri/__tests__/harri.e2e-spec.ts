/**
 * E2E test for the Harri ATS scraper.
 *
 * Harri (harri.com) is a hospitality hiring platform. Employer careers pages
 * are publicly accessible at `harri.com/{employerSlug}` and list open positions
 * as server-rendered HTML. There is no public anonymous JSON API; the scraper
 * parses job links from the HTML listing page and fetches each job-detail page.
 *
 * Tests run against a known Harri-powered tenant but tolerate upstream changes
 * / empty job boards by treating zero results as acceptable; shape assertions
 * only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HarriModule, HarriService } from '@ever-jobs/source-ats-harri';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('HarriService (E2E)', () => {
  let service: HarriService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HarriModule],
    }).compile();

    service = module.get<HarriService>(HarriService);
  });

  it('should return job results for a known Harri tenant', async () => {
    // riverstation-careers is a UK restaurant employer on Harri with a public
    // careers page. We tolerate zero results in case the board is temporarily
    // empty; shape assertions are guarded by length > 0.
    const input = new ScraperInputDto({
      siteType: [Site.HARRI],
      companySlug: 'riverstation-careers',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.HARRI);
      expect(job.atsType).toBe('harri');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
      expect(job.jobUrl).toContain('harri.com');
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HARRI],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HARRI],
      companySlug: 'this-employer-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    // careers_uk is Harri's own UK careers page — typically has a small
    // number of open roles, making it a good target for the limit test.
    const input = new ScraperInputDto({
      siteType: [Site.HARRI],
      companySlug: 'careers_uk',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  }, 60000);
});
