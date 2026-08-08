/**
 * E2E test for the ApplicantPro ATS scraper.
 *
 * No authentication required — ApplicantPro exposes a public XML sitemap
 * (`https://{tenant}.applicantpro.com/sitemap.xml`) enumerating every open role
 * as a server-rendered detail page (`/jobs/{jobId}.html`). The adapter resolves
 * the tenant from `companySlug` (the board sub-domain label). Tests run against
 * a known ApplicantPro-powered tenant but tolerate upstream changes / empty
 * boards by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantProModule, ApplicantProService } from '@ever-jobs/source-ats-applicantpro';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public ApplicantPro-powered job board (City of Pharr, TX).
const KNOWN_TENANT = 'pharrtx';

describe('ApplicantProService (E2E)', () => {
  let service: ApplicantProService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApplicantProModule],
    }).compile();

    service = module.get<ApplicantProService>(ApplicantProService);
  });

  it('should return job results for a known ApplicantPro tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTPRO],
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
      expect(job.site).toBe(Site.APPLICANTPRO);
      expect(job.atsType).toBe('applicantpro');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTPRO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTPRO],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLICANTPRO],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
