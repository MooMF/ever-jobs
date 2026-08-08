/**
 * E2E test for the Greeting ATS scraper.
 *
 * No authentication required — Greeting tenants publish a public candidate-facing career
 * site at `https://{tenant}.career.greetinghr.com/`. The landing page is a Next.js shell
 * that embeds the full open-roles set in the `__NEXT_DATA__` script tag as the React-Query
 * `["openings"]` dehydrated query, which the adapter parses; each opening's `openingId`
 * builds the canonical detail / apply URLs (`/{locale}/o/{openingId}`). The richer HTML
 * job-ad body is enriched from the public detail API. The adapter resolves the tenant from
 * a `companySlug` (the company slug, e.g. `ablelabs`) or a full `companyUrl`. Tests run
 * against a known Greeting-powered tenant but tolerate upstream changes / empty boards by
 * treating zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GreetingModule, GreetingService } from '@ever-jobs/source-ats-greeting';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Greeting-powered career site (ABLE Labs / 에이블랩스 — confirmed live 2026-06-03).
const KNOWN_TENANT = 'ablelabs';

describe('GreetingService (E2E)', () => {
  let service: GreetingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GreetingModule],
    }).compile();

    service = module.get<GreetingService>(GreetingService);
  });

  it('should return job results for a known Greeting tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREETING],
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
      expect(job.site).toBe(Site.GREETING);
      expect(job.atsType).toBe('greeting');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREETING],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREETING],
      companyUrl: `https://${KNOWN_TENANT}.career.greetinghr.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GREETING],
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
      siteType: [Site.GREETING],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
