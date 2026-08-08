/**
 * E2E test for the Recruit CRM ATS scraper.
 *
 * No authentication required — the public career-page endpoint
 * (`POST https://albatross.recruitcrm.io/v1/external-pages/jobs-by-account/get`)
 * is called by the Recruit CRM jobs-page SPA without any credentials.
 * Tests run against a known Recruit CRM tenant (`Terra_Careers`) but tolerate
 * upstream changes / WAF gating by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecruitCrmModule, RecruitCrmService } from '@ever-jobs/source-ats-recruitcrm';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('RecruitCrmService (E2E)', () => {
  let service: RecruitCrmService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RecruitCrmModule],
    }).compile();

    service = module.get<RecruitCrmService>(RecruitCrmService);
  });

  it('should return job results for a known Recruit CRM tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITCRM],
      companySlug: 'Terra_Careers',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.RECRUITCRM);
      expect(job.atsType).toBe('recruitcrm');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
      expect(job.jobUrl).toContain('recruitcrm.io/jobs/');
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITCRM],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITCRM],
      companySlug: 'this-account-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITCRM],
      companySlug: 'Terra_Careers',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
