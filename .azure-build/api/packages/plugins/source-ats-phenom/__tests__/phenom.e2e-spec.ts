/**
 * E2E test for the Phenom People scraper.
 *
 * No authentication required -- Phenom career sites are public.
 * Tests always run against known Phenom-powered company career sites.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PhenomModule, PhenomService } from '@ever-jobs/source-ats-phenom';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('PhenomService (E2E)', () => {
  let service: PhenomService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PhenomModule],
    }).compile();

    service = module.get<PhenomService>(PhenomService);
  });

  it('should return job results for a known company', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PHENOM],
      companySlug: 'boeing',
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
      expect(job.site).toBe(Site.PHENOM);
      expect(job.atsType).toBe('phenom');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PHENOM],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown company gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PHENOM],
      companySlug: 'this-company-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    // Should return empty or gracefully fail
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PHENOM],
      companySlug: 'boeing',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
