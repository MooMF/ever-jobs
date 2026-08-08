/**
 * E2E test for the JobDiva ATS scraper.
 *
 * No authentication required — JobDiva exposes public candidate-portal XML jobs
 * feeds (`GET https://www1.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a={portalId}`
 * and the employer "connect" list feed) keyed by an opaque portal key that is
 * the tenant's public read key. The adapter resolves that key from `companySlug`
 * (a bare portal key, a `{host}|{portalId}` pair, or a portal URL) or from a
 * `companyUrl` whose `a` query parameter is the portal key. Tests run against a
 * known JobDiva-powered portal but tolerate upstream changes / empty portals by
 * treating zero results as acceptable; the shape assertions only run when jobs
 * are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobDivaModule, JobDivaService } from '@ever-jobs/source-ats-jobdiva';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public JobDiva candidate-portal key (verified live 2026-06-03 against
// https://www1.jobdiva.com/portal/?a=… — "Current Openings").
const KNOWN_TENANT =
  'a7jdnwsus2fmiuqyajck4mcntz54pf05a6mnogtaphm9mt9tz8opkrtglw4v6gqf';

describe('JobDivaService (E2E)', () => {
  let service: JobDivaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobDivaModule],
    }).compile();

    service = module.get<JobDivaService>(JobDivaService);
  });

  it('should return job results for a known JobDiva tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDIVA],
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
      expect(job.site).toBe(Site.JOBDIVA);
      expect(job.atsType).toBe('jobdiva');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should resolve a tenant from a full portal companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDIVA],
      companyUrl: `https://www1.jobdiva.com/portal/?a=${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDIVA],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDIVA],
      companySlug: 'thisportalkeydefinitelydoesnotexistxyz99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBDIVA],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
