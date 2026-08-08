/**
 * E2E test for the Sage People (Fairsail) ATS scraper.
 *
 * No authentication required — Sage People tenants publish a public candidate-facing
 * applicant portal as a Salesforce Site at
 * `https://{tenant}.my.salesforce-sites.com/{path}/`. The open-roles board
 * (`fRecruit__ApplyJobList`) is a server-rendered Visualforce page that embeds the full
 * open-roles set in the HTML as a table whose rows each link to a role's detail / apply
 * page (`fRecruit__ApplyJob?vacancyNo=VN…`), which the adapter harvests; each role's
 * `vacancyNo` is the stable ATS id and the canonical detail-URL key. The adapter resolves
 * the tenant from a `companySlug` (the Salesforce-Site sub-domain label, e.g.
 * `acteonpeopleportal`) or a full `companyUrl`. Tests run against a known Sage People
 * tenant but tolerate upstream changes / empty boards by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SagePeopleModule, SagePeopleService } from '@ever-jobs/source-ats-sagepeople';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Sage People-powered applicant portal (Acteon Group — confirmed live 2026-06-03).
const KNOWN_TENANT = 'acteonpeopleportal';

describe('SagePeopleService (E2E)', () => {
  let service: SagePeopleService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SagePeopleModule],
    }).compile();

    service = module.get<SagePeopleService>(SagePeopleService);
  });

  it('should return job results for a known Sage People tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEPEOPLE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.SAGEPEOPLE);
      expect(job.atsType).toBe('sagepeople');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEPEOPLE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEPEOPLE],
      companyUrl: `https://${KNOWN_TENANT}.my.salesforce-sites.com/careers/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEPEOPLE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEPEOPLE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
