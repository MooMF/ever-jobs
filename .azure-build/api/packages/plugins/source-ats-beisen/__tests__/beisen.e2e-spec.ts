/**
 * E2E test for the Beisen (北森 / iTalent) ATS scraper.
 *
 * No authentication required — Beisen tenants publish a public candidate-facing career SPA at
 * `https://{slug}.zhiye.com`. The adapter resolves the tenant config from the bootstrap HTML
 * (`/portal/registerSystemInfo` → inline `BSGlobal.PortalId`) and then pages the public listing
 * endpoint (`POST /api/Jobad/GetJobAdPageList`). Tests run against a known Beisen-powered tenant
 * but tolerate upstream changes / empty boards / WAF gating by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BeisenModule, BeisenService } from '@ever-jobs/source-ats-beisen';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Beisen-powered career site (bare tenant subdomain on `*.zhiye.com`).
const KNOWN_SLUG = 'mengniu';

describe('BeisenService (E2E)', () => {
  let service: BeisenService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BeisenModule],
    }).compile();

    service = module.get<BeisenService>(BeisenService);
  });

  it('should return job results (or gracefully empty) for a known Beisen tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEISEN],
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
      expect(job.site).toBe(Site.BEISEN);
      expect(job.atsType).toBe('beisen');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toContain('.zhiye.com/portal/jobs/');
    }
  }, 45000);

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEISEN],
      companyUrl: `https://${KNOWN_SLUG}.zhiye.com/social/jobs`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 45000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEISEN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });
});
