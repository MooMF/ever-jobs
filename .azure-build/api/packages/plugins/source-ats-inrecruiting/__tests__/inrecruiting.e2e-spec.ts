/**
 * E2E test for the In-recruiting (Intervieweb) ATS scraper.
 *
 * No authentication required — In-recruiting tenants publish a public, server-rendered
 * career board on the shared host `*.intervieweb.it`, in two addressing shapes: a
 * sub-domain tenant (`https://{tenant}.intervieweb.it/{lang}/career`) and a shared-host
 * + path tenant (`https://{host}.intervieweb.it/{tenant}/{lang}/career`). The board
 * lists each open role as a canonical job anchor (`/jobs/{slug}-{id}/{lang}/`) whose
 * trailing numeric `{id}` is the stable ATS id; each role's detail page often embeds a
 * schema.org `JobPosting` JSON-LD block (with `og:` / `<title>` / card fallbacks). The
 * adapter resolves the tenant from a `companySlug` (the tenant slug, e.g. `rinascente`)
 * or a full `companyUrl`. Tests run against a known In-recruiting-powered tenant but
 * tolerate upstream changes / empty feeds by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { InRecruitingModule, InRecruitingService } from '@ever-jobs/source-ats-inrecruiting';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public In-recruiting-powered career site (RINASCENTE — confirmed live 2026-06-03).
const KNOWN_TENANT = 'rinascente';

describe('InRecruitingService (E2E)', () => {
  let service: InRecruitingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [InRecruitingModule],
    }).compile();

    service = module.get<InRecruitingService>(InRecruitingService);
  });

  it('should return job results for a known In-recruiting tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INRECRUITING],
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
      expect(job.site).toBe(Site.INRECRUITING);
      expect(job.atsType).toBe('inrecruiting');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INRECRUITING],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INRECRUITING],
      companyUrl: `https://${KNOWN_TENANT}.intervieweb.it/en/career`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INRECRUITING],
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
      siteType: [Site.INRECRUITING],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
