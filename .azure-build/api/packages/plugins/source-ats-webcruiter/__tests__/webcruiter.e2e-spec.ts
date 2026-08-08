/**
 * E2E test for the Webcruiter ATS scraper.
 *
 * No authentication required — Webcruiter exposes a public candidate-portal
 * advert-search endpoint (`POST /api/odvert/companysearch/{companyLock}`) keyed
 * by a tenant's numeric "company lock" id. Tests run against a known
 * Webcruiter-powered tenant but tolerate upstream changes / empty tenants by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WebcruiterModule, WebcruiterService } from '@ever-jobs/source-ats-webcruiter';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public company-lock id for the Norwegian Refugee Council's Webcruiter portal
// (https://candidate.webcruiter.com/en-gb/home/companyadverts?companyLock=23109900).
const KNOWN_COMPANY_LOCK = '23109900';

describe('WebcruiterService (E2E)', () => {
  let service: WebcruiterService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WebcruiterModule],
    }).compile();

    service = module.get<WebcruiterService>(WebcruiterService);
  });

  it('should return job results for a known Webcruiter tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WEBCRUITER],
      companySlug: KNOWN_COMPANY_LOCK,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.WEBCRUITER);
      expect(job.atsType).toBe('webcruiter');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WEBCRUITER],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WEBCRUITER],
      companySlug: '99999999999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WEBCRUITER],
      companySlug: KNOWN_COMPANY_LOCK,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
