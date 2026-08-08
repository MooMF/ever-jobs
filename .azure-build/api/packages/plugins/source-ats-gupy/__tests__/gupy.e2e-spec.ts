/**
 * E2E test for the Gupy ATS scraper.
 *
 * No authentication required — Gupy tenants publish a public candidate-facing career
 * site at `https://{tenant}.gupy.io/`. The career-site landing page is a server-rendered
 * Next.js app that embeds the full open-roles set in the HTML inside the Next.js data
 * island `<script id="__NEXT_DATA__" type="application/json">{ … }</script>` at
 * `props.pageProps.jobs`, which the adapter parses; each role's numeric `id` builds the
 * canonical detail / apply URL `/jobs/{id}`. The adapter resolves the tenant from a
 * `companySlug` (the sub-domain label, e.g. `sicredi`) or a full `companyUrl`. Tests run
 * against a known Gupy-powered tenant but tolerate upstream changes / empty boards by
 * treating zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GupyModule, GupyService } from '@ever-jobs/source-ats-gupy';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Gupy-powered career site (Sicredi — confirmed live 2026-06-03).
const KNOWN_TENANT = 'sicredi';

describe('GupyService (E2E)', () => {
  let service: GupyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GupyModule],
    }).compile();

    service = module.get<GupyService>(GupyService);
  });

  it('should return job results for a known Gupy tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GUPY],
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
      expect(job.site).toBe(Site.GUPY);
      expect(job.atsType).toBe('gupy');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GUPY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GUPY],
      companyUrl: `https://${KNOWN_TENANT}.gupy.io/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GUPY],
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
      siteType: [Site.GUPY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
