/**
 * E2E test for the ApplicantStack (SwipeClock / WorkforceHub) ATS scraper.
 *
 * No authentication required — ApplicantStack tenants publish a public,
 * server-rendered job board at
 * `https://{tenant}.applicantstack.com/x/openings` (an HTML table of open roles
 * linking to `/x/detail/{jobId}` pages). The adapter resolves the tenant from a
 * `companySlug` (the sub-domain label, e.g. `atwork443`) or a full `companyUrl`.
 * Tests run against a known ApplicantStack-powered tenant but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantStackModule, ApplicantStackService } from '@ever-jobs/source-ats-applicantstack';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public ApplicantStack-powered careers sub-domain (At Work Group — verified live 2026-06-03).
const KNOWN_TENANT = 'atwork443';

describe('ApplicantStackService (E2E)', () => {
  let service: ApplicantStackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicantStackModule],
    }).compile();

    service = module.get<ApplicantStackService>(ApplicantStackService);
  });

  it('should return job results for a known ApplicantStack tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTSTACK],
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
      expect(job.site).toBe(Site.APPLICANTSTACK);
      expect(job.atsType).toBe('applicantstack');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTSTACK],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTSTACK],
      companyUrl: `https://${KNOWN_TENANT}.applicantstack.com/x/openings`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTSTACK],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTSTACK],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
