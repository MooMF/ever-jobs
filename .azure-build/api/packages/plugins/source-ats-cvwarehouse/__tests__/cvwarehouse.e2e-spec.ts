/**
 * E2E test for the CVWarehouse ATS scraper.
 *
 * No authentication required — CVWarehouse tenants publish a public candidate-facing job board
 * at `https://jobpage.cvwarehouse.com/?companyGuid={guid}&lang={lang}`. The board is
 * server-rendered HTML: one GET returns every open role as an `<a class="jobLink"
 * data-jobid="…">` anchor plus a sibling `<div data-jobdetail-job-id="…">` detail block bearing
 * the full HTML body and a `/ApplicationForm/AppForm` apply link. The adapter fetches the board
 * once, parses every role, and maps it. The numeric `data-jobid` is the stable ATS id and the
 * detail block's `data-canonical-url` is the canonical deep-link. The adapter resolves the
 * tenant from a `companySlug` (the company GUID) or a full `companyUrl`. Tests run against a
 * known CVWarehouse-powered tenant but tolerate upstream changes / empty boards by treating zero
 * results as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CvWarehouseModule, CvWarehouseService } from '@ever-jobs/source-ats-cvwarehouse';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public CVWarehouse-powered board (a live tenant — confirmed live 2026-06-04).
const KNOWN_TENANT = '0875aa48-21be-43a2-b7cd-1ca7b94b2249';

describe('CvWarehouseService (E2E)', () => {
  let service: CvWarehouseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CvWarehouseModule],
    }).compile();

    service = module.get<CvWarehouseService>(CvWarehouseService);
  });

  it('should return job results for a known CVWarehouse tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CVWAREHOUSE],
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
      expect(job.site).toBe(Site.CVWAREHOUSE);
      expect(job.atsType).toBe('cvwarehouse');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CVWAREHOUSE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CVWAREHOUSE],
      companyUrl: `https://jobpage.cvwarehouse.com/?companyGuid=${KNOWN_TENANT}&lang=en-US`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CVWAREHOUSE],
      companySlug: '00000000-0000-0000-0000-000000000000',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CVWAREHOUSE],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
