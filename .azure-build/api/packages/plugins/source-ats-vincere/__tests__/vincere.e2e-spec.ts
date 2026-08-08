/**
 * E2E test for the Vincere Instant Job Board ATS scraper.
 *
 * No authentication required — the Vincere Instant Job Board exposes a
 * public AJAX search endpoint (`POST /careers/ajax/search-jobs`) that the
 * board's own front-end calls. A CSRF token is first obtained anonymously from
 * the careers listing page GET; the AJAX endpoint requires only that token
 * plus the associated session cookie.
 *
 * Tests run against `nordicjobsworldwide.vincere.io`, a known Vincere-powered
 * tenant confirmed live on 2026-06-03. Results are tolerated as zero if the
 * upstream tenant is unavailable or has moved; shape assertions only fire when
 * jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { VincereModule, VincereService } from '@ever-jobs/source-ats-vincere';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('VincereService (E2E)', () => {
  let service: VincereService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VincereModule],
    }).compile();

    service = module.get<VincereService>(VincereService);
  });

  it('should return job results for a known Vincere tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VINCERE],
      companySlug: 'nordicjobsworldwide',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.VINCERE);
      expect(job.atsType).toBe('vincere');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VINCERE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VINCERE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VINCERE],
      companySlug: 'nordicjobsworldwide',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
