/**
 * E2E test for the Softgarden ATS scraper.
 *
 * No authentication is required — Softgarden modern (React) career pages expose
 * a public, anonymous schema.org JobPosting DataFeed at
 * `GET {tenantOrigin}/jobs.feed.json`. Tests run against a known
 * Softgarden-powered tenant but tolerate upstream changes or WAF gating by
 * treating zero results as acceptable; shape assertions only run when jobs are
 * actually returned.
 *
 * Known live tenant used for testing:
 *   - `companyUrl: 'https://softgarden.career.softgarden.de'` — softgarden
 *     e-recruiting GmbH's own career page (Germany).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SoftgardenModule, SoftgardenService } from '@ever-jobs/source-ats-softgarden';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('SoftgardenService (E2E)', () => {
  let service: SoftgardenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SoftgardenModule],
    }).compile();

    service = module.get<SoftgardenService>(SoftgardenService);
  });

  it('should return job results for a known Softgarden tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTGARDEN],
      companyUrl: 'https://softgarden.career.softgarden.de',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.SOFTGARDEN);
      expect(job.atsType).toBe('softgarden');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTGARDEN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTGARDEN],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTGARDEN],
      companyUrl: 'https://softgarden.career.softgarden.de',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
