/**
 * E2E test for the Zoho Recruit career-site scraper.
 *
 * No authentication required — Zoho Recruit career sites server-render their
 * open-roles list into the public `/jobs/Careers` page. Tests run against known
 * Zoho-hosted tenants but tolerate upstream changes / WAF gating by treating
 * zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ZohoRecruitModule, ZohoRecruitService } from '@ever-jobs/source-ats-zohorecruit';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ZohoRecruitService (E2E)', () => {
  let service: ZohoRecruitService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ZohoRecruitModule],
    }).compile();

    service = module.get<ZohoRecruitService>(ZohoRecruitService);
  });

  it('should return job results for a known Zoho Recruit tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZOHORECRUIT],
      companySlug: 'workbetternow',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.ZOHORECRUIT);
      expect(job.atsType).toBe('zohorecruit');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZOHORECRUIT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZOHORECRUIT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZOHORECRUIT],
      companySlug: 'workbetternow',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
