/**
 * E2E test for the Workforce.com ATS hiring scraper.
 *
 * No authentication required — Workforce.com tenants publish public, anonymous candidate-
 * facing apply pages at `https://{region}.workforce.com/ats/apply/job/{uuid}` (region is
 * `app` for US / default, `eu` for Europe) that server-render the full role detail plus the
 * application form. A tenant's careers / board page links to those apply pages; the adapter
 * harvests every `/ats/apply/job/{uuid}` link from a board URL (a single apply URL degrades to
 * a one-role board), then parses each role's apply page (schema.org JobPosting ld+json first,
 * else scraped title / og: meta). The adapter is addressed by a `companyUrl` (a careers / board
 * URL or a single apply URL) or a `companySlug` (a role UUID, else a slug probed against
 * defensive Workforce-hosted board paths).
 *
 * Surface confidence: the per-role apply page is verified live (confirmed against Workforce.com's
 * own hiring); multi-tenant board enumeration is built defensively (verified=false). Tests run
 * against the public Workforce.com careers board but tolerate upstream changes / empty boards by
 * treating zero results as acceptable; the shape assertions only run when jobs are actually
 * returned. 30000 ms timeouts on network tests.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WorkforceModule, WorkforceService } from '@ever-jobs/source-ats-workforce';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Workforce.com-hosted careers board (Workforce.com dogfoods its own ATS — its careers
// page links to `/ats/apply/job/{uuid}` apply pages on the Workforce host).
const KNOWN_BOARD_URL = 'https://www.workforce.com/uk/careers';

describe('WorkforceService (E2E)', () => {
  let service: WorkforceService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WorkforceModule],
    }).compile();

    service = module.get<WorkforceService>(WorkforceService);
  });

  it('should return job results for a known Workforce.com careers board', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKFORCE],
      companyUrl: KNOWN_BOARD_URL,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.WORKFORCE);
      expect(job.atsType).toBe('workforce');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKFORCE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a single role from a direct apply URL', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKFORCE],
      companyUrl:
        'https://eu.workforce.com/ats/apply/job/f384bcf7-d2b2-467a-a4b3-37752859629e',
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.site).toBe(Site.WORKFORCE);
      expect(job.atsType).toBe('workforce');
      expect(job.atsId).toBe('f384bcf7-d2b2-467a-a4b3-37752859629e');
    }
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKFORCE],
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
      siteType: [Site.WORKFORCE],
      companyUrl: KNOWN_BOARD_URL,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
