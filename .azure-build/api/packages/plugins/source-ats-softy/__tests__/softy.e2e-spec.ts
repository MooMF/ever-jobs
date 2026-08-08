/**
 * E2E test for the Softy (softy.pro) ATS scraper.
 *
 * No authentication required — Softy tenants publish a public, server-rendered
 * careers board at `https://{tenant}.softy.pro/offres`, listing each open role as a
 * canonical detail anchor (`/offre/{ID}-{title-slug}`) with labelled card text
 * (title, location city, contract type, "Mise en ligne le DD/MM/YYYY"). The adapter
 * resolves the tenant from a `companySlug` (the sub-domain label, e.g. `groupecls`)
 * or a full `companyUrl`. Tests run against a known Softy-powered tenant but tolerate
 * upstream changes / empty boards by treating zero results as acceptable; the shape
 * assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SoftyModule, SoftyService } from '@ever-jobs/source-ats-softy';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Softy-powered careers board (Groupe CLS — confirmed live 2026-06-03).
const KNOWN_TENANT = 'groupecls';

describe('SoftyService (E2E)', () => {
  let service: SoftyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SoftyModule],
    }).compile();

    service = module.get<SoftyService>(SoftyService);
  });

  it('should return job results for a known Softy tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTY],
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
      expect(job.site).toBe(Site.SOFTY);
      expect(job.atsType).toBe('softy');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTY],
      companyUrl: `https://${KNOWN_TENANT}.softy.pro/offres`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOFTY],
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
      siteType: [Site.SOFTY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
