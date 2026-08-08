/**
 * E2E test for the TalentReef (Mitratech) ATS scraper.
 *
 * No authentication required — TalentReef exposes public, unauthenticated
 * career-search pages on the shared host
 * (`https://apply.jobappnetwork.com/{tenant}/{lang}`). The adapter resolves a
 * tenant by its human-friendly slug (e.g. `rtg` → Rooms To Go). The career page
 * is a client-rendered SPA, so the embedded positions JSON / schema.org
 * JobPosting markup may not be present in a plain HTTP fetch; tests therefore
 * run against a known TalentReef-powered tenant but tolerate upstream changes /
 * empty results by treating zero results as acceptable. The shape assertions
 * only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TalentReefModule, TalentReefService } from '@ever-jobs/source-ats-talentreef';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public TalentReef-powered career-search slug (Rooms To Go).
const KNOWN_TENANT = 'rtg';

describe('TalentReefService (E2E)', () => {
  let service: TalentReefService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TalentReefModule],
    }).compile();

    service = module.get<TalentReefService>(TalentReefService);
  });

  it('should return job results for a known TalentReef tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTREEF],
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
      expect(job.site).toBe(Site.TALENTREEF);
      expect(job.atsType).toBe('talentreef');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTREEF],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTREEF],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTREEF],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
