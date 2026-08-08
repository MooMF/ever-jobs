/**
 * E2E test for the LiveHire (Humanforce Talent) ATS scraper.
 *
 * No authentication required — LiveHire tenants publish a public talent-community
 * careers board at `https://www.livehire.com/careers/{tenant}/jobs`. That board is
 * a client-rendered SPA whose backing JSON API rejects non-browser clients, so the
 * adapter consumes LiveHire's server-rendered, public embeddable jobs widget for
 * the same tenant at `https://www.livehire.com/widgets/job-listings/{tenant}`,
 * which lists each open role with a canonical careers job URL
 * (`/careers/{tenant}/job/{CODE}/{ID}/{title-slug}`). The adapter resolves the
 * tenant from a `companySlug` (the company slug, e.g. `perthmint`) or a full
 * `companyUrl`. Tests run against a known LiveHire-powered tenant but tolerate
 * upstream changes / empty feeds by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { LiveHireModule, LiveHireService } from '@ever-jobs/source-ats-livehire';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public LiveHire-powered talent community (The Perth Mint — confirmed live 2026-06-03).
const KNOWN_TENANT = 'perthmint';

describe('LiveHireService (E2E)', () => {
  let service: LiveHireService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LiveHireModule],
    }).compile();

    service = module.get<LiveHireService>(LiveHireService);
  });

  it('should return job results for a known LiveHire tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LIVEHIRE],
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
      expect(job.site).toBe(Site.LIVEHIRE);
      expect(job.atsType).toBe('livehire');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LIVEHIRE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LIVEHIRE],
      companyUrl: `https://www.livehire.com/careers/${KNOWN_TENANT}/jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LIVEHIRE],
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
      siteType: [Site.LIVEHIRE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
