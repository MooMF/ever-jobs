/**
 * E2E test for the Recooty ATS scraper.
 *
 * No authentication required — Recooty exposes a public Job Widget feed
 * (`GET /api/widget/{widgetId}`) keyed by a dashboard-issued widget id that
 * doubles as the tenant's public read API key. Tests run against a known
 * Recooty-powered widget but tolerate upstream changes / empty tenants by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RecootyModule, RecootyService } from '@ever-jobs/source-ats-recooty';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public sample widget id shipped in Recooty's own Job Widget integration.
const KNOWN_WIDGET_ID = 'd16fb36f0911f878998c136191af705e';

describe('RecootyService (E2E)', () => {
  let service: RecootyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RecootyModule],
    }).compile();

    service = module.get<RecootyService>(RecootyService);
  });

  it('should return job results for a known Recooty widget', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECOOTY],
      companySlug: KNOWN_WIDGET_ID,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.RECOOTY);
      expect(job.atsType).toBe('recooty');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECOOTY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown widget gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECOOTY],
      companySlug: 'this-widget-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RECOOTY],
      companySlug: KNOWN_WIDGET_ID,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
