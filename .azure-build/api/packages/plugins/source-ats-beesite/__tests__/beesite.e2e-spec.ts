/**
 * E2E test for the BeeSite ATS scraper.
 *
 * No authentication required — BeeSite tenants run a public candidate-facing career
 * portal (hosted at `https://{slug}.beesite.de/` or mounted at `/cust/beesite/` on a
 * customer domain), driven by a `?ac=…` PHP front controller. The adapter ingests open
 * roles from the JobBoardApi JSON board (`/search/?data={…}`, HR-XML
 * `MatchedObjectDescriptor` envelope) when exposed, falling back to the server-rendered
 * `?ac=search_result` list of `SearchResultBox` rows that link to
 * `?ac=jobad&id={PositionID}` detail pages. The adapter resolves the portal origin from
 * a `companySlug` (expanded to `{slug}.beesite.de`) or a full `companyUrl` (hosted or
 * custom-domain). Tests run against a known BeeSite-powered portal but tolerate upstream
 * changes / empty boards by treating zero results as acceptable; the shape assertions
 * only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BeeSiteModule, BeeSiteService } from '@ever-jobs/source-ats-beesite';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public BeeSite-powered career portal (milch & zucker demo — confirmed platform 2026-06-03).
const KNOWN_SLUG = 'frontend-demo';
// A live custom-domain BeeSite portal (Drägerwerk AG — confirmed live 2026-06-03).
const KNOWN_PORTAL_URL = 'https://erecruitment.draeger.com/cust/beesite/?ac=start';

describe('BeeSiteService (E2E)', () => {
  let service: BeeSiteService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BeeSiteModule],
    }).compile();

    service = module.get<BeeSiteService>(BeeSiteService);
  });

  it('should return job results (or a tolerated empty set) for a known BeeSite tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEESITE],
      companySlug: KNOWN_SLUG,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.BEESITE);
      expect(job.atsType).toBe('beesite');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEESITE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a portal from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEESITE],
      companyUrl: KNOWN_PORTAL_URL,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEESITE],
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
      siteType: [Site.BEESITE],
      companySlug: KNOWN_SLUG,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
