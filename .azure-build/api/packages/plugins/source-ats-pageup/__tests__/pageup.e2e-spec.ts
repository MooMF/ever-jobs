/**
 * E2E test for the PageUp ATS scraper.
 *
 * No authentication required — PageUp tenants publish a public candidate careers
 * site on the shared platform host (`https://careers.pageuppeople.com/{instanceId}/caw/en/`)
 * whose open roles are enumerated by a server-rendered listing index
 * (`/{instanceId}/caw/en/listing/`) and detailed on server-rendered pages carrying
 * `<strong>`-labelled fields (with schema.org `JobPosting` JSON-LD where a tenant
 * enables Google-for-Jobs). The adapter resolves the listing base from a
 * `companySlug` (the numeric instance id, e.g. `595`) or a full `companyUrl`.
 * Tests run against a known PageUp-powered tenant but tolerate upstream changes /
 * empty feeds by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PageUpModule, PageUpService } from '@ever-jobs/source-ats-pageup';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public PageUp-powered candidate site (Calor — confirmed live 2026-06-03).
const KNOWN_TENANT = '595';

describe('PageUpService (E2E)', () => {
  let service: PageUpService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PageUpModule],
    }).compile();

    service = module.get<PageUpService>(PageUpService);
  });

  it('should return job results for a known PageUp tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAGEUP],
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
      expect(job.site).toBe(Site.PAGEUP);
      expect(job.atsType).toBe('pageup');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAGEUP],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAGEUP],
      companyUrl: `https://careers.pageuppeople.com/${KNOWN_TENANT}/caw/en/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAGEUP],
      companySlug: '99999999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PAGEUP],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
