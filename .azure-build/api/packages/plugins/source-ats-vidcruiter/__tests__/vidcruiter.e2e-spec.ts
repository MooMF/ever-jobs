/**
 * E2E test for the VidCruiter ATS scraper.
 *
 * No authentication required — VidCruiter tenants publish a public candidate-facing job board at
 * `https://{tenant}.hiringplatform.com/list/{slug}/`, backed by a single public, anonymous JSON
 * feed the board itself consumes: `GET https://{tenant}.hiringplatform.com/list/{slug}.json?page={n}`
 * that returns `{ business_processes: [ …role… ] }`. The adapter resolves the tenant subdomain +
 * board slug, drains the feed page by page (until an empty `business_processes`), and maps each
 * role. Each role's numeric `id` is the stable ATS id and its `url` (`/processes/{uuid}?locale=en`)
 * is the canonical detail / apply URL. The adapter resolves the tenant from a `companySlug` (the
 * tenant subdomain, e.g. `vidcruiter`) or a full `companyUrl`. Tests run against a known
 * VidCruiter-powered tenant but tolerate upstream changes / empty boards by treating zero results
 * as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { VidCruiterModule, VidCruiterService } from '@ever-jobs/source-ats-vidcruiter';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public VidCruiter-powered board (VidCruiter's own employer board — confirmed live 2026-06-04 at
// https://vidcruiter.hiringplatform.com/list/careers/).
const KNOWN_TENANT = 'vidcruiter';

describe('VidCruiterService (E2E)', () => {
  let service: VidCruiterService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VidCruiterModule],
    }).compile();

    service = module.get<VidCruiterService>(VidCruiterService);
  });

  it('should return job results for a known VidCruiter tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIDCRUITER],
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
      expect(job.site).toBe(Site.VIDCRUITER);
      expect(job.atsType).toBe('vidcruiter');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIDCRUITER],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIDCRUITER],
      companyUrl: `https://${KNOWN_TENANT}.hiringplatform.com/list/careers/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIDCRUITER],
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
      siteType: [Site.VIDCRUITER],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
