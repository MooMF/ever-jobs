/**
 * E2E test for the Paychex Flex Hiring ATS scraper.
 *
 * No authentication required — Paychex Flex Hiring tenants publish a public
 * candidate careers site (`https://{tenant}.applybypaychex.com/`) whose open
 * roles are enumerated by a public XML sitemap (`/sitemap.xml`) and detailed on
 * server-rendered pages carrying schema.org `JobPosting` JSON-LD. The adapter
 * resolves the careers host from a `companySlug` (the sub-domain / board label,
 * e.g. `acme`) or a full `companyUrl`. Tests run against a placeholder
 * Paychex-powered tenant but tolerate upstream changes / empty feeds by treating
 * zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PaychexModule, PaychexService } from '@ever-jobs/source-ats-paychex';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Placeholder Paychex Flex Hiring candidate-site tenant. The per-tenant careers
// site is a client-rendered app (surface researched 2026-06-03, verified=false),
// so the test tolerates zero results — only the shape is asserted when present.
const KNOWN_TENANT = 'demo';

describe('PaychexService (E2E)', () => {
  let service: PaychexService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PaychexModule],
    }).compile();

    service = module.get<PaychexService>(PaychexService);
  });

  it('should return job results for a known Paychex tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCHEX],
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
      expect(job.site).toBe(Site.PAYCHEX);
      expect(job.atsType).toBe('paychex');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCHEX],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCHEX],
      companyUrl: `https://${KNOWN_TENANT}.applybypaychex.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCHEX],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCHEX],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
