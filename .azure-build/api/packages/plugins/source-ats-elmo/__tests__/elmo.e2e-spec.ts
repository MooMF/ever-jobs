/**
 * E2E test for the ELMO ATS scraper.
 *
 * No authentication required — ELMO tenants publish a public candidate-facing career
 * board at `https://{tenant}.elmotalent.com.au/careers/{board}` (and the NZ host
 * `.elmotalent.co.nz`). The open-roles index is a server-rendered HTML page that lists
 * the tenant's open roles inline; each role links to its canonical detail page
 * `/careers/{board}/job/view/{jobId}`, whose numeric `{jobId}` is the stable ATS id. The
 * adapter scrapes those listing links and resolves the tenant from a `companySlug` (the
 * company slug, e.g. `anzca`) or a full `companyUrl` (whose path may carry the `{board}`
 * segment). Tests run against a known ELMO-powered tenant but tolerate upstream changes /
 * empty boards / marketing-site redirects by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ElmoModule, ElmoService } from '@ever-jobs/source-ats-elmo';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public ELMO-powered career site (ANZCA — surface researched 2026-06-03).
const KNOWN_TENANT = 'anzca';

describe('ElmoService (E2E)', () => {
  let service: ElmoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ElmoModule],
    }).compile();

    service = module.get<ElmoService>(ElmoService);
  });

  it('should return job results for a known ELMO tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ELMO],
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
      expect(job.site).toBe(Site.ELMO);
      expect(job.atsType).toBe('elmo');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ELMO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ELMO],
      companyUrl: `https://${KNOWN_TENANT}.elmotalent.com.au/careers/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ELMO],
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
      siteType: [Site.ELMO],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
