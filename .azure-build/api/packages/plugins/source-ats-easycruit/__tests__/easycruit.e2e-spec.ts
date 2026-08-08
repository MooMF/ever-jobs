/**
 * E2E test for the EasyCruit ATS scraper.
 *
 * No authentication required — EasyCruit (Visma) exposes a public vacancy-list
 * XML feed per tenant sub-domain
 * (`GET https://{tenant}.easycruit.com/export/xml/vacancy/list.xml`). The
 * adapter resolves the tenant from `companySlug` (the sub-domain label) or
 * `companyUrl`. Tests run against a known EasyCruit-powered tenant but tolerate
 * upstream changes / empty tenants by treating zero results as acceptable; the
 * shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EasyCruitModule, EasyCruitService } from '@ever-jobs/source-ats-easycruit';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public EasyCruit-powered careers sub-domain (Esvagt A/S).
const KNOWN_TENANT = 'esvagt';

describe('EasyCruitService (E2E)', () => {
  let service: EasyCruitService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EasyCruitModule],
    }).compile();

    service = module.get<EasyCruitService>(EasyCruitService);
  });

  it('should return job results for a known EasyCruit tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EASYCRUIT],
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
      expect(job.site).toBe(Site.EASYCRUIT);
      expect(job.atsType).toBe('easycruit');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EASYCRUIT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EASYCRUIT],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EASYCRUIT],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
