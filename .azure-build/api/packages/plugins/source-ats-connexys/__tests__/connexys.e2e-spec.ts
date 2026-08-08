/**
 * E2E test for the Connexys ATS scraper.
 *
 * No authentication required — Connexys tenants publish their open roles to a public,
 * candidate-facing career site, and for each publication channel the Connexys-hosted site
 * exposes a public, anonymous XML vacancy feed
 * `GET https://www.connexys.nl/{site}public/run/xml_feed.startup?p_pub_id={channelId}` that
 * returns a `<vacancies>` envelope of `<vacancy>` elements. The adapter fetches the feed,
 * parses each `<vacancy>` (`titel`, `plaats`, `omschrijving`, `publicatiedatum`, `url`, …) and
 * maps it to a JobPostDto. Each role's `id` is the stable ATS id and its `<url>` is the
 * canonical detail / apply page. The adapter resolves the tenant from a `companySlug` (the
 * Connexys site name, optionally `site#channelId`) or a full `companyUrl`. Tests run against a
 * known Connexys-powered tenant but tolerate upstream changes / empty channels / a
 * platform-migrated host by treating zero results as acceptable; the shape assertions only run
 * when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConnexysModule, ConnexysService } from '@ever-jobs/source-ats-connexys';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Connexys-powered career site (a Connexys site name observed in the public feed
// addressing scheme). Live results may be empty if the tenant has migrated platforms.
const KNOWN_TENANT = 'reinierdegraaf';

describe('ConnexysService (E2E)', () => {
  let service: ConnexysService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConnexysModule],
    }).compile();

    service = module.get<ConnexysService>(ConnexysService);
  });

  it('should return job results for a known Connexys tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONNEXYS],
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
      expect(job.site).toBe(Site.CONNEXYS);
      expect(job.atsType).toBe('connexys');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONNEXYS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONNEXYS],
      companyUrl: `https://www.connexys.nl/${KNOWN_TENANT}public/run/xml_feed.startup?p_pub_id=1`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONNEXYS],
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
      siteType: [Site.CONNEXYS],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
