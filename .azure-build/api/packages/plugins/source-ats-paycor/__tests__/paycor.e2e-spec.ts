/**
 * E2E test for the Paycor Recruiting (formerly Newton Software) ATS scraper.
 *
 * No authentication required — Paycor Recruiting tenants publish a public career
 * portal (`GET https://recruitingbypaycor.com/career/CareerHome.action?clientId={clientId}`)
 * that lists every open role as an anchor to each role's
 * `JobIntroduction.action?clientId={clientId}&id={jobId}` detail page. The adapter
 * resolves the tenant from a `companySlug` (the opaque `clientId` token) or a full
 * `companyUrl` carrying a `clientId` query param. Tests run against a known
 * Paycor-powered tenant but tolerate upstream changes / empty portals by treating
 * zero results as acceptable; the shape assertions only run when jobs are actually
 * returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PaycorModule, PaycorService } from '@ever-jobs/source-ats-paycor';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Paycor-powered career portal clientId (verified live 2026-06-03).
const KNOWN_TENANT = '8afc05ca3677c9a501367a8b233e51f1';

describe('PaycorService (E2E)', () => {
  let service: PaycorService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PaycorModule],
    }).compile();

    service = module.get<PaycorService>(PaycorService);
  });

  it('should return job results for a known Paycor tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCOR],
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
      expect(job.site).toBe(Site.PAYCOR);
      expect(job.atsType).toBe('paycor');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCOR],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCOR],
      companyUrl: `https://recruitingbypaycor.com/career/CareerHome.action?clientId=${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCOR],
      companySlug: 'this-client-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAYCOR],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
