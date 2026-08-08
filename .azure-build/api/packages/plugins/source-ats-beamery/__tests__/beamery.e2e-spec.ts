/**
 * E2E test for the Beamery ATS / talent-CRM scraper.
 *
 * No authentication required — Beamery tenants publish a public candidate-facing career site
 * (Beamery's own at `https://careers.beamery.com/`, branded tenant portals at
 * `https://{tenant}.beamery.com/`), with per-role public detail pages at
 * `https://{host}/jobs/job/{uuid}-{title-slug}/`. The careers site is server-rendered and
 * exposes no CONFIRMED anonymous JSON jobs feed (the candidate-facing `/api/...` routes are
 * gated and the only structured API is the authenticated `frontier.beamery.com` REST API), so
 * the adapter is defensive: it probes a best-effort candidate-facing JSON route and degrades to
 * an empty result when none is served. The adapter resolves the tenant from a `companySlug`
 * (the sub-domain label, e.g. `careers`) or a full `companyUrl`. Tests run against a known
 * Beamery-powered tenant but tolerate the SSR-only / gated surface by treating zero results as
 * acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BeameryModule, BeameryService } from '@ever-jobs/source-ats-beamery';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Beamery-powered career site (Beamery's own board — host confirmed live 2026-06-04).
const KNOWN_TENANT = 'careers';

describe('BeameryService (E2E)', () => {
  let service: BeameryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BeameryModule],
    }).compile();

    service = module.get<BeameryService>(BeameryService);
  });

  it('should return job results (or tolerate empty) for a known Beamery tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEAMERY],
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
      expect(job.site).toBe(Site.BEAMERY);
      expect(job.atsType).toBe('beamery');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEAMERY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEAMERY],
      companyUrl: `https://${KNOWN_TENANT}.beamery.com/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BEAMERY],
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
      siteType: [Site.BEAMERY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
