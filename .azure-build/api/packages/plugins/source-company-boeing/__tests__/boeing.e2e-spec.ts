/**
 * E2E test for the Boeing scraper.
 *
 * Hits the live Boeing jobs API -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BoeingModule, BoeingService } from '@ever-jobs/source-company-boeing';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('BoeingService (E2E)', () => {
  let service: BoeingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BoeingModule],
    }).compile();

    service = module.get<BoeingService>(BoeingService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BOEING],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.site).toBe(Site.BOEING);
      expect(job.companyName).toBe('Boeing');
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
    }
  });

  it('should filter by search term', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BOEING],
      searchTerm: 'engineer',
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should support markdown description format', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BOEING],
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
  });

  it('should handle empty results gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BOEING],
      searchTerm: 'zzzznonexistentjobtitlexyz123',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
