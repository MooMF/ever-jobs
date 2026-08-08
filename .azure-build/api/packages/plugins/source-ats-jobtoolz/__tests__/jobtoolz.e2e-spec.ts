/**
 * E2E test for the Jobtoolz ATS scraper.
 *
 * No authentication required — Jobtoolz tenants publish a public candidate-facing jobsite
 * at `https://{tenant}.jobtoolz.com/{locale}`. The open-roles board (`/nl`, with `en` /
 * `fr` locale variants) is a server-rendered shell that embeds the full open-vacancy set
 * in the HTML as the first argument of a `window.jobComponent([ … ], …)` bootstrap call
 * (HTML-entity-encoded inside an Alpine.js `x-data` attribute), which the adapter parses;
 * each vacancy's numeric `id` is the stable ATS id and its `url` is the canonical detail /
 * apply page. The adapter resolves the tenant from a `companySlug` (the company slug, e.g.
 * `tordale`) or a full `companyUrl`. Tests run against a known Jobtoolz-powered tenant but
 * tolerate upstream changes / empty boards by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobtoolzModule, JobtoolzService } from '@ever-jobs/source-ats-jobtoolz';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Jobtoolz-powered jobsite (Tordale — confirmed live 2026-06-03).
const KNOWN_TENANT = 'tordale';

describe('JobtoolzService (E2E)', () => {
  let service: JobtoolzService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobtoolzModule],
    }).compile();

    service = module.get<JobtoolzService>(JobtoolzService);
  });

  it('should return job results for a known Jobtoolz tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTOOLZ],
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
      expect(job.site).toBe(Site.JOBTOOLZ);
      expect(job.atsType).toBe('jobtoolz');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTOOLZ],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTOOLZ],
      companyUrl: `https://${KNOWN_TENANT}.jobtoolz.com/nl`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBTOOLZ],
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
      siteType: [Site.JOBTOOLZ],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
