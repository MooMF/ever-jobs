/**
 * E2E test for the Sage HR (sage.hr) ATS scraper.
 *
 * No authentication required — Sage HR exposes a public, anonymous candidate
 * careers site at `https://talent.sage.hr/{careerSiteId}/vacancies`, keyed by the
 * tenant's career site UUID. Tests run against a known Sage-HR-powered career
 * site but tolerate upstream changes / empty tenants by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SageHrModule, SageHrService } from '@ever-jobs/source-ats-sagehr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Sage HR career site id (Newstel Worldwide HQ), verified live 2026-06-03
// at https://talent.sage.hr/cf0157f8-8d5e-4d2a-a9f7-0a80b348b097/vacancies.
const KNOWN_CAREER_SITE_ID = 'cf0157f8-8d5e-4d2a-a9f7-0a80b348b097';

describe('SageHrService (E2E)', () => {
  let service: SageHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SageHrModule],
    }).compile();

    service = module.get<SageHrService>(SageHrService);
  });

  it('should return job results for a known Sage HR career site', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEHR],
      companySlug: KNOWN_CAREER_SITE_ID,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.SAGEHR);
      expect(job.atsType).toBe('sagehr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown career site gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEHR],
      companySlug: '00000000-0000-0000-0000-000000000000',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SAGEHR],
      companySlug: KNOWN_CAREER_SITE_ID,
      resultsWanted: 1,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(1);
  }, 30000);
});
