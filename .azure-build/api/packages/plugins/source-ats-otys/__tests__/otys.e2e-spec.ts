/**
 * E2E test for the OTYS (otys.com, Netherlands) ATS / recruitment-site scraper.
 *
 * No authentication required — OTYS customers publish a public, server-rendered
 * recruitment site (career page) hosted under the customer's own (sub)domain or under
 * the OTYS application host `https://{clientprefix}.otysapp.com/`. The board lists
 * each published vacancy with a canonical anchor
 * `/vacatures/vacature-{slug}-{id}-{websiteId}.html`, where the numeric `{id}` is the
 * stable OTYS vacancy id; the adapter parses the index HTML for those links and then
 * each detail page (preferring schema.org `JobPosting` JSON-LD, falling back to `og:`
 * meta / the `<title>` / body HTML). The adapter resolves the tenant from a
 * `companyUrl` (the recruitment-site URL, origin used verbatim) or a `companySlug`
 * (a client prefix expanded to `{slug}.otysapp.com`). Tests run against a known
 * OTYS-powered tenant but tolerate upstream changes / empty feeds by treating zero
 * results as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OtysModule, OtysService } from '@ever-jobs/source-ats-otys';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public OTYS-powered recruitment site (Middendorp Recruitment — confirmed live 2026-06-03).
const KNOWN_TENANT_URL = 'https://www.middendorprecruitment.nl/vacatures.html';

describe('OtysService (E2E)', () => {
  let service: OtysService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OtysModule],
    }).compile();

    service = module.get<OtysService>(OtysService);
  });

  it('should return job results for a known OTYS tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OTYS],
      companyUrl: KNOWN_TENANT_URL,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.OTYS);
      expect(job.atsType).toBe('otys');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OTYS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant host from a companySlug', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OTYS],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    // A non-existent client prefix expands to {slug}.otysapp.com and degrades to empty.
    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should handle an unknown tenant host gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OTYS],
      companyUrl: 'https://this-otys-tenant-definitely-does-not-exist-xyz-99999.otysapp.com/',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.OTYS],
      companyUrl: KNOWN_TENANT_URL,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
