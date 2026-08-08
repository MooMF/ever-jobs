/**
 * E2E test for the Breathe HR ATS scraper.
 *
 * No authentication required — Breathe tenants publish a public, server-rendered, candidate-facing
 * vacancy page per role at `https://hr.breathehr.com/v/{slug}-{id}`, where the trailing `{id}` is
 * the tenant's stable numeric recruitment vacancy id (the ATS id). The page carries the role's
 * structured fields in stable class-named markup (`.job-title`, `.vacancy-company`, `.salary`,
 * `.location`, the `.vacancy-date` blocks, and the `.trix-content` body).
 *
 * Breathe does not host a public per-tenant vacancy index, so tenants embed the `/v/{slug}-{id}`
 * share links on their own public careers page. The adapter therefore resolves a tenant either
 * from a direct vacancy reference (a `/v/{slug}-{id}` URL or bare `{slug}-{id}` token passed as
 * `companySlug`) or by harvesting the embedded share links from the tenant's own careers page
 * (`companyUrl`). Tests run against a known public Breathe vacancy but tolerate upstream changes /
 * removed roles by treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BreatheHrModule, BreatheHrService } from '@ever-jobs/source-ats-breathehr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// A public Breathe-hosted vacancy share token (confirmed live, anonymous, 2026-06-04). The
// adapter resolves a bare `{slug}-{id}` token directly to its `/v/{slug}-{id}` detail page.
const KNOWN_TENANT = 'advocacy-worker-43996';

describe('BreatheHrService (E2E)', () => {
  let service: BreatheHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BreatheHrModule],
    }).compile();

    service = module.get<BreatheHrService>(BreatheHrService);
  });

  it('should return job results for a known Breathe HR vacancy', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BREATHEHR],
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
      expect(job.site).toBe(Site.BREATHEHR);
      expect(job.atsType).toBe('breathehr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BREATHEHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a vacancy from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BREATHEHR],
      companyUrl: `https://hr.breathehr.com/v/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BREATHEHR],
      companySlug: 'this-vacancy-definitely-does-not-exist-xyz-99999999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BREATHEHR],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
