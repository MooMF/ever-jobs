/**
 * E2E test for the Bullhorn scraper.
 *
 * To run live tests, set BULLHORN_CORP_TOKEN env var (format: cls:corpToken).
 * Without the env var, only the "no companySlug" test runs unconditionally.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BullhornModule, BullhornService } from '@ever-jobs/source-ats-bullhorn';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('BullhornService (E2E)', () => {
  let service: BullhornService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BullhornModule],
    }).compile();

    service = module.get<BullhornService>(BullhornService);
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BULLHORN],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should return empty results when companySlug has invalid format', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BULLHORN],
      companySlug: 'invalid-no-colon',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  // Conditional live test — only runs when BULLHORN_CORP_TOKEN is set
  const corpToken = process.env.BULLHORN_CORP_TOKEN;
  const describeIfToken = corpToken ? describe : describe.skip;

  describeIfToken('with BULLHORN_CORP_TOKEN', () => {
    it('should return job results from Bullhorn API', async () => {
      const input = new ScraperInputDto({
        siteType: [Site.BULLHORN],
        companySlug: corpToken!,
        resultsWanted: 5,
        descriptionFormat: DescriptionFormat.MARKDOWN,
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      expect(Array.isArray(response.jobs)).toBe(true);

      if (response.jobs.length > 0) {
        const job = response.jobs[0];
        expect(job.title).toBeDefined();
        expect(typeof job.title).toBe('string');
        expect(job.site).toBe(Site.BULLHORN);
        expect(job.atsType).toBe('bullhorn');
        expect(job.atsId).toBeDefined();
        expect(job.datePosted).toBeDefined();
      }
    });
  });
});
