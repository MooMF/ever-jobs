/**
 * E2E test for the Hirehive ATS scraper.
 *
 * No authentication required — Hirehive tenants publish a public candidate-facing career
 * site at `https://{tenant}.hirehive.com/`, backed by a public, anonymous JSON feed at
 * `GET /api/v2/jobs?page={n}&page_size={k}&source=CareerSite` that returns a JSON:API-style
 * envelope `{ meta, links, items }`; the adapter GETs that feed, drains pages via
 * `meta.has_next_page`, and maps each `items[]` role. Each role's string `id` is the stable
 * ATS id and its `hosted_url` is the canonical detail / apply URL. The adapter resolves the
 * tenant from a `companySlug` (the sub-domain label, e.g. `hirehive`) or a full
 * `companyUrl`. Tests run against a known Hirehive-powered tenant but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HirehiveModule, HirehiveService } from '@ever-jobs/source-ats-hirehive';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Hirehive-powered career site (HireHive's own board — confirmed live 2026-06-03).
const KNOWN_TENANT = 'hirehive';

describe('HirehiveService (E2E)', () => {
  let service: HirehiveService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HirehiveModule],
    }).compile();

    service = module.get<HirehiveService>(HirehiveService);
  });

  it('should return job results for a known Hirehive tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREHIVE],
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
      expect(job.site).toBe(Site.HIREHIVE);
      expect(job.atsType).toBe('hirehive');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREHIVE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREHIVE],
      companyUrl: `https://${KNOWN_TENANT}.hirehive.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HIREHIVE],
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
      siteType: [Site.HIREHIVE],
      // Demo board with multiple pages of roles — exercises pagination + the limit.
      companySlug: 'hirehive-testing-account',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
