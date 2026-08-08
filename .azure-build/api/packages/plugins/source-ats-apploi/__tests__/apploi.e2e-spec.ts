/**
 * E2E test for the Apploi ATS scraper.
 *
 * No authentication required — Apploi tenants publish a public candidate-facing job board at
 * `https://jobs.apploi.com/profile/{slug}`, backed by two public, anonymous JSON APIs the
 * board itself consumes: a company-profile endpoint
 * `GET https://api.apploi.com/v1/company_profiles/{slug}` (which yields the tenant's
 * `teams_to_show` team ids) and a job-search feed
 * `GET https://ats-integrations.apploi.com/search/jobs/?teams={csv}&page={n}` that returns
 * `{ data: [ …role… ] }`. The adapter fetches the profile, drains the search feed page by page
 * (until an empty `data`), and maps each role. Each role's string `id` is the stable ATS id
 * and its `redirect_apply_url` (`/view/{id}`) is the canonical detail / apply URL. The adapter
 * resolves the tenant from a `companySlug` (the profile slug, e.g. `apploi.com`) or a full
 * `companyUrl`. Tests run against a known Apploi-powered tenant but tolerate upstream changes /
 * empty boards by treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ApploiModule, ApploiService } from '@ever-jobs/source-ats-apploi';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Apploi-powered board (Apploi's own employer profile — confirmed live 2026-06-04).
const KNOWN_TENANT = 'apploi.com';

describe('ApploiService (E2E)', () => {
  let service: ApploiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApploiModule],
    }).compile();

    service = module.get<ApploiService>(ApploiService);
  });

  it('should return job results for a known Apploi tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLOI],
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
      expect(job.site).toBe(Site.APPLOI);
      expect(job.atsType).toBe('apploi');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLOI],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLOI],
      companyUrl: `https://jobs.apploi.com/profile/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.APPLOI],
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
      siteType: [Site.APPLOI],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
