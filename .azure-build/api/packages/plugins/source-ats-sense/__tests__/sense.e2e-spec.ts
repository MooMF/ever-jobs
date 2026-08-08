/**
 * E2E test for the Sense (sensehq.com) ATS scraper.
 *
 * No authentication required — Sense tenants publish a public candidate-facing career site at
 * `https://{tenant}.sensehq.com/careers`, backed by a public, anonymous JSON feed at
 * `GET /careers/api/jobs?page={n}` (0-based page, fixed 10-row page size) that returns a
 * `{ success, data: { count, rows } }` envelope; the adapter GETs that feed, drains pages by
 * index, and maps each `data.rows[]` role. Each role's numeric `id` is the stable ATS id and
 * the canonical detail / apply URL is `https://{tenant}.sensehq.com/careers/jobs/{id}`. The
 * adapter resolves the tenant from a `companySlug` (the sub-domain label, e.g. `sensehr`) or a
 * full `companyUrl`. Tests run against a known Sense-powered tenant but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SenseModule, SenseService } from '@ever-jobs/source-ats-sense';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Sense-powered career site (Sense's own careers board — confirmed live 2026-06-04).
const KNOWN_TENANT = 'sensehr';

describe('SenseService (E2E)', () => {
  let service: SenseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SenseModule],
    }).compile();

    service = module.get<SenseService>(SenseService);
  });

  it('should return job results for a known Sense tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SENSE],
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
      expect(job.site).toBe(Site.SENSE);
      expect(job.atsType).toBe('sense');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SENSE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SENSE],
      companyUrl: `https://${KNOWN_TENANT}.sensehq.com/careers`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SENSE],
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
      siteType: [Site.SENSE],
      // Sense's own board carries 15+ roles across multiple pages — exercises pagination +
      // the limit.
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
