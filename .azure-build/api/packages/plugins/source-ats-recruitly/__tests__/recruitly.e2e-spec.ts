/**
 * E2E test for the Recruitly ATS scraper.
 *
 * No authentication required — Recruitly tenants expose their published roles through a
 * public, anonymous JSON endpoint on the shared API host
 * (`https://api.recruitly.io/api/job?apiKey={apiKey}`), addressed by the tenant's public
 * board API key. The endpoint answers a `{ "data": [ … ] }` envelope; each role carries a
 * `hire…`-prefixed string `id` (the stable ATS id and the final segment of the public
 * apply URL `https://jobs.recruitly.io/widget/apply/{id}`), an agency `reference`, a
 * structured `location`, an HTML `description`, and a public `applyUrl`. The adapter
 * resolves the board key from a `companySlug` (the bare key) or a `companyUrl` (a Recruitly
 * board / widget / API URL carrying an `apiKey` query parameter). Tests run against a known
 * Recruitly board key but tolerate upstream changes / empty boards by treating zero results
 * as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecruitlyModule, RecruitlyService } from '@ever-jobs/source-ats-recruitly';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Recruitly board API key (demo board, confirmed live 2026-06-03).
const KNOWN_API_KEY = 'WEAV1001764028E594BF49688A653966A1729A21';

describe('RecruitlyService (E2E)', () => {
  let service: RecruitlyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RecruitlyModule],
    }).compile();

    service = module.get<RecruitlyService>(RecruitlyService);
  });

  it('should return job results for a known Recruitly board', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITLY],
      companySlug: KNOWN_API_KEY,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.RECRUITLY);
      expect(job.atsType).toBe('recruitly');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITLY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a board key from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITLY],
      companyUrl: `https://api.recruitly.io/api/job?apiKey=${KNOWN_API_KEY}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown board key gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITLY],
      companySlug: 'THIS-BOARD-KEY-DEFINITELY-DOES-NOT-EXIST-XYZ-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECRUITLY],
      companySlug: KNOWN_API_KEY,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
