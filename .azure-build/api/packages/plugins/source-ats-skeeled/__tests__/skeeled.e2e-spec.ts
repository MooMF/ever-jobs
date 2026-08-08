/**
 * E2E test for the Skeeled ATS scraper.
 *
 * No authentication is required — Skeeled tenants publish a public, anonymous
 * job board at `https://app.skeeled.com/board/{boardId}` whose offer catalogue
 * is embedded in the server-rendered Nuxt data island. Tests run against a
 * known Skeeled-powered board but tolerate upstream changes or WAF gating by
 * treating zero results as acceptable; shape assertions only run when jobs are
 * actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - board `63ff6b1561114076fed6be2d` — CBL s.a (Luxembourg).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SkeeledModule, SkeeledService } from '@ever-jobs/source-ats-skeeled';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

const KNOWN_BOARD_ID = '63ff6b1561114076fed6be2d';

describe('SkeeledService (E2E)', () => {
  let service: SkeeledService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SkeeledModule],
    }).compile();

    service = module.get<SkeeledService>(SkeeledService);
  });

  it('should return job results for a known Skeeled board', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SKEELED],
      companySlug: KNOWN_BOARD_ID,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect((job.title ?? '').length).toBeGreaterThan(0);
      expect(job.site).toBe(Site.SKEELED);
      expect(job.atsType).toBe('skeeled');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
      expect((job.jobUrl ?? '').length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SKEELED],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown board gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SKEELED],
      companySlug: 'ffffffffffffffffffffffff',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SKEELED],
      companyUrl: `https://app.skeeled.com/board/${KNOWN_BOARD_ID}`,
      resultsWanted: 1,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(1);
  }, 30000);
});
