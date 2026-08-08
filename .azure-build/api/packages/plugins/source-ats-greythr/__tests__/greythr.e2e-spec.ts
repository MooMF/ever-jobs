/**
 * E2E test for the greytHR (greytHR Recruit) ATS scraper.
 *
 * No authentication required — greytHR tenants publish a public candidate-facing careers
 * board at `https://{tenant}.greythr.com/hire/jobs/`. That board is a client-rendered SPA
 * whose open roles are fetched from the public, anonymous JSON endpoint
 * `POST {origin}/hire/api/career/published_jobs/` (body `{}`), which returns
 * `{ data: [ … ] }`; the adapter POSTs that endpoint and maps each role. Each role's UUID
 * `id` is the stable ATS id and the API supplies a fully-built public detail / apply URL
 * (`/hire/jobs/{slug}`). The adapter resolves the tenant from a `companySlug` (the
 * sub-domain label, e.g. `greytip`) or a full `companyUrl`. Tests run against a known
 * greytHR-powered tenant but tolerate upstream changes / empty boards by treating zero
 * results as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GreytHrModule, GreytHrService } from '@ever-jobs/source-ats-greythr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public greytHR-powered careers board (Greytip Software — confirmed live 2026-06-03).
const KNOWN_TENANT = 'greytip';

describe('GreytHrService (E2E)', () => {
  let service: GreytHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GreytHrModule],
    }).compile();

    service = module.get<GreytHrService>(GreytHrService);
  });

  it('should return job results for a known GreytHR tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREYTHR],
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
      expect(job.site).toBe(Site.GREYTHR);
      expect(job.atsType).toBe('greythr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREYTHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREYTHR],
      companyUrl: `https://${KNOWN_TENANT}.greythr.com/hire/jobs/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREYTHR],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREYTHR],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
