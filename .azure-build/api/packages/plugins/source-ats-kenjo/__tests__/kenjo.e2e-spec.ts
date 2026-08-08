/**
 * E2E test for the Kenjo ATS scraper.
 *
 * No authentication required — Kenjo tenants publish a public candidate-facing career site
 * at `https://{tenant}.kenjo.io/` (an Angular SPA), backed by a public, anonymous JSON API
 * on the same origin: `GET /api/controller/career-site/public/{tenant}/positions` returns a
 * career-site config envelope carrying an `activePositions[]` array, and
 * `GET /api/controller/career-site/public/{tenant}/positions/{customUrl}` returns a single
 * role enriched with `jobDescription.html`. The adapter GETs the list, reads
 * `activePositions[]`, and enriches each role from its detail record. Each role's `_id` is
 * the stable ATS id and its public detail page is `{origin}/positions/{customUrl}`. The
 * adapter resolves the tenant from a `companySlug` (the sub-domain label, e.g. `careers`) or
 * a full `companyUrl`. Tests run against a known Kenjo-powered tenant but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { KenjoModule, KenjoService } from '@ever-jobs/source-ats-kenjo';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Kenjo-powered career site (Kenjo GmbH's own board — confirmed live 2026-06-03).
const KNOWN_TENANT = 'careers';

describe('KenjoService (E2E)', () => {
  let service: KenjoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [KenjoModule],
    }).compile();

    service = module.get<KenjoService>(KenjoService);
  });

  it('should return job results for a known Kenjo tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KENJO],
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
      expect(job.site).toBe(Site.KENJO);
      expect(job.atsType).toBe('kenjo');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KENJO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KENJO],
      companyUrl: `https://${KNOWN_TENANT}.kenjo.io/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.KENJO],
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
      siteType: [Site.KENJO],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
