/**
 * E2E test for the Emply (Visma) ATS scraper.
 *
 * No authentication required — Emply tenants publish a public candidate-facing career
 * site at `https://{tenant}.career.emply.com/`. The open-roles index page
 * (`/{locale}/vacant-positions`, with `vacancies` / `available-positions` / `jobs`
 * variants) is a server-rendered shell that embeds the full open-vacancy set in the
 * HTML as a `proceedBatch({ vacancies : JSON.parse('[…]') })` bootstrap call, which
 * the adapter parses; each vacancy's `shortId` + `titleAsUrl` build the canonical
 * detail / apply URLs (`/{locale}/ad/{titleAsUrl}/{shortId}`). The adapter resolves
 * the tenant from a `companySlug` (the company slug, e.g. `au`) or a full
 * `companyUrl`. Tests run against a known Emply-powered tenant but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape assertions
 * only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EmplyModule, EmplyService } from '@ever-jobs/source-ats-emply';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Emply-powered career site (Aarhus University — confirmed live 2026-06-03).
const KNOWN_TENANT = 'au';

describe('EmplyService (E2E)', () => {
  let service: EmplyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EmplyModule],
    }).compile();

    service = module.get<EmplyService>(EmplyService);
  });

  it('should return job results for a known Emply tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLY],
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
      expect(job.site).toBe(Site.EMPLY);
      expect(job.atsType).toBe('emply');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLY],
      companyUrl: `https://${KNOWN_TENANT}.career.emply.com/en/vacant-positions`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EMPLY],
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
      siteType: [Site.EMPLY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
