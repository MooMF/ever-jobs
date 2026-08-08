/**
 * E2E test for the Subscribe-HR ATS scraper.
 *
 * No authentication required — Subscribe-HR tenants publish a public candidate-facing careers
 * board at `https://{tenant}.careers.subscribe-hr.com/`, a server-rendered HTML page that
 * carries every open role inline as a self-contained card (the role's `data-vacancyId`, hidden
 * `jobName` / `jobShortDescription` / `jobUrl` inputs, a `<ul>` of attribute bullets, and a
 * `<div class="job-desc">` summary). The board paginates with a bare `?page={n}` control. The
 * adapter walks the listing pages, parses each card, and maps each role. Each card's
 * `data-vacancyId` is the stable ATS id and its `jobUrl` (`/jobs/{id}-{slug}`) is the canonical
 * detail / apply URL. The adapter resolves the tenant from a `companySlug` (the partner key,
 * e.g. `subscribehr16`) or a full `companyUrl`. Tests run against a known Subscribe-HR-powered
 * tenant but tolerate upstream changes / empty boards by treating zero results as acceptable;
 * the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SubscribeHrModule, SubscribeHrService } from '@ever-jobs/source-ats-subscribehr';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Subscribe-HR-powered careers board (confirmed live 2026-06-04).
const KNOWN_TENANT = 'subscribehr16';

describe('SubscribeHrService (E2E)', () => {
  let service: SubscribeHrService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SubscribeHrModule],
    }).compile();

    service = module.get<SubscribeHrService>(SubscribeHrService);
  });

  it('should return job results for a known Subscribe-HR tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SUBSCRIBEHR],
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
      expect(job.site).toBe(Site.SUBSCRIBEHR);
      expect(job.atsType).toBe('subscribehr');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SUBSCRIBEHR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SUBSCRIBEHR],
      companyUrl: `https://${KNOWN_TENANT}.careers.subscribe-hr.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SUBSCRIBEHR],
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
      siteType: [Site.SUBSCRIBEHR],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
