/**
 * E2E test for the Symphony Talent / SmashFlyX ATS scraper.
 *
 * No authentication required — Symphony Talent tenants publish a branded, public
 * candidate-facing career site backed by one shared, anonymous JSON jobs API at
 * `GET https://jobsapi-internal.m-cloud.io/api/job?Organization={orgId}&Limit={n}&offset={k}`
 * that returns a flat envelope `{ totalHits, queryResult }`; the adapter GETs that feed,
 * advances `offset` to drain pages bounded by `totalHits`, and maps each `queryResult[]`
 * role. Each role's numeric `id` is the stable ATS id and its `url` is the canonical detail
 * page. The adapter resolves the tenant from a `companySlug` (the numeric `Organization` id,
 * e.g. `2015`) or a full `companyUrl` carrying an `Organization=` param. Tests run against a
 * known Symphony-Talent-powered org but tolerate upstream changes / empty boards by treating
 * zero results as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SymphonyTalentModule, SymphonyTalentService } from '@ever-jobs/source-ats-symphonytalent';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Symphony-Talent-powered career site (Symphony Talent's own board — confirmed live
// 2026-06-03 via the m-cloud.io jobs API, Organization=2015).
const KNOWN_ORG = '2015';

describe('SymphonyTalentService (E2E)', () => {
  let service: SymphonyTalentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SymphonyTalentModule],
    }).compile();

    service = module.get<SymphonyTalentService>(SymphonyTalentService);
  });

  it('should return job results for a known Symphony Talent organisation', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SYMPHONYTALENT],
      companySlug: KNOWN_ORG,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.SYMPHONYTALENT);
      expect(job.atsType).toBe('symphonytalent');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SYMPHONYTALENT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve an organisation from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SYMPHONYTALENT],
      companyUrl: `https://jobsapi-internal.m-cloud.io/api/job?Organization=${KNOWN_ORG}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown organisation gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SYMPHONYTALENT],
      companySlug: '99999999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SYMPHONYTALENT],
      companySlug: KNOWN_ORG,
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  }, 30000);
});
