/**
 * E2E test for the HR-ON Recruit ATS scraper.
 *
 * No authentication required — HR-ON Recruit tenants publish a public,
 * server-rendered career page that links to each role via a
 * `/jobposts*?jobid={ID}` detail page. Tests run against a known HR-ON-powered
 * career page (HR-ON's own, at `https://hr-on.com/careers/`) but tolerate
 * upstream changes / empty tenants by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HrOnModule, HrOnService } from '@ever-jobs/source-ats-hron';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// A known, public HR-ON Recruit career page (HR-ON ApS' own careers site).
const KNOWN_CAREER_URL = 'https://hr-on.com/careers/';

describe('HrOnService (E2E)', () => {
  let service: HrOnService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HrOnModule],
    }).compile();

    service = module.get<HrOnService>(HrOnService);
  });

  it('should return job results for a known HR-ON career page', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRON],
      companyUrl: KNOWN_CAREER_URL,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.HRON);
      expect(job.atsType).toBe('hron');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRON],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRON],
      companyUrl: 'https://hr-on.com/this-tenant-definitely-does-not-exist-xyz-99999/careers/',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HRON],
      companyUrl: KNOWN_CAREER_URL,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
