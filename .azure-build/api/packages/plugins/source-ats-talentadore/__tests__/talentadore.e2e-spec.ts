/**
 * E2E test for the TalentAdore ATS scraper.
 *
 * No authentication required — TalentAdore exposes a public positions feed
 * (`GET https://ats.talentadore.com/positions/{feedKey}/json`) keyed by a
 * feed-builder token that doubles as the tenant's public read key. The adapter
 * resolves that key from the tenant's careers sub-domain
 * (`{companySlug}.careers.talentadore.com`). Tests run against a known
 * TalentAdore-powered tenant but tolerate upstream changes / empty tenants by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TalentAdoreModule, TalentAdoreService } from '@ever-jobs/source-ats-talentadore';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public TalentAdore-powered careers sub-domain (Amer Sports).
const KNOWN_TENANT = 'amersports';

describe('TalentAdoreService (E2E)', () => {
  let service: TalentAdoreService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TalentAdoreModule],
    }).compile();

    service = module.get<TalentAdoreService>(TalentAdoreService);
  });

  it('should return job results for a known TalentAdore tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTADORE],
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
      expect(job.site).toBe(Site.TALENTADORE);
      expect(job.atsType).toBe('talentadore');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTADORE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTADORE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTADORE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
