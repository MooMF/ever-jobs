/**
 * E2E test for the Eddy ATS scraper.
 *
 * No authentication required — Eddy tenants publish a public candidate-facing careers
 * board at `https://app.eddy.com/careers/{organizationUuid}`. The board is a single-page
 * app backed by a public, anonymous JSON API keyed by the organization UUID:
 *   GET /api/ats/public/job-opening/organization/{organizationUuid}  (list)
 *   GET /api/ats/public/job-opening/{jobOpeningUuid}/organization/{organizationUuid} (detail)
 * which the adapter calls; each role's `jobOpeningUuid` builds the canonical detail / apply
 * URL `/careers/{org}/{jobUuid}`. The adapter resolves the tenant from a `companySlug` (the
 * organization UUID) or a full `companyUrl`. Tests run against a known Eddy-powered tenant
 * but tolerate upstream changes / empty boards by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EddyModule, EddyService } from '@ever-jobs/source-ats-eddy';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Eddy-powered careers organization UUID (confirmed live 2026-06-03 — the public
// list + detail endpoints answered HTTP 200 anonymously for this org). Boards are dynamic,
// so the tenant may have zero open roles at any given moment; the tests tolerate that.
const KNOWN_TENANT = '9ef4ab55-a0bc-4572-92b6-1aa0c19bae3d';

describe('EddyService (E2E)', () => {
  let service: EddyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EddyModule],
    }).compile();

    service = module.get<EddyService>(EddyService);
  });

  it('should return job results for a known Eddy tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EDDY],
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
      expect(job.site).toBe(Site.EDDY);
      expect(job.atsType).toBe('eddy');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EDDY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EDDY],
      companyUrl: `https://app.eddy.com/careers/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EDDY],
      companySlug: '00000000-0000-4000-8000-000000000000',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EDDY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
