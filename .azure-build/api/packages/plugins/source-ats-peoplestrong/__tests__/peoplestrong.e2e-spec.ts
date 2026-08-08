/**
 * E2E test for the PeopleStrong ATS candidate-portal scraper.
 *
 * No authentication required — PeopleStrong tenants publish a public candidate-facing
 * career portal at `https://{tenant}.peoplestrong.com/`. The portal is a client-rendered
 * SPA whose open-roles board is hydrated from a tenant-scoped JSON endpoint, which the
 * adapter probes (falling back to an embedded HTML data island / schema.org JSON-LD on a
 * pre-rendered tenant); each role's stable id builds the canonical detail / apply URL
 * `/job/detail/{jobId}`. The adapter resolves the tenant from a `companySlug` (the
 * sub-domain label, e.g. `exlcareers`) or a full `companyUrl`. Tests run against a real
 * PeopleStrong-powered tenant but tolerate upstream changes / empty boards / a
 * CSRF-guarded board by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned. (Surface confidence: tenant addressing + detail-URL
 * pattern verified live 2026-06-03; open-roles JSON payload documented-but-unverified.)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PeopleStrongModule, PeopleStrongService } from '@ever-jobs/source-ats-peoplestrong';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public PeopleStrong-powered candidate portal (EXL — host confirmed live 2026-06-03).
const KNOWN_TENANT = 'exlcareers';

describe('PeopleStrongService (E2E)', () => {
  let service: PeopleStrongService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PeopleStrongModule],
    }).compile();

    service = module.get<PeopleStrongService>(PeopleStrongService);
  });

  it('should return job results for a known PeopleStrong tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLESTRONG],
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
      expect(job.site).toBe(Site.PEOPLESTRONG);
      expect(job.atsType).toBe('peoplestrong');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLESTRONG],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLESTRONG],
      companyUrl: `https://${KNOWN_TENANT}.peoplestrong.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PEOPLESTRONG],
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
      siteType: [Site.PEOPLESTRONG],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
