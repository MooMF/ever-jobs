/**
 * E2E test for the Bayt scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BaytModule, BaytService } from '@ever-jobs/source-bayt';
import { ScraperInputDto, Site, Country, DescriptionFormat } from '@ever-jobs/models';

describe('BaytService (E2E)', () => {
  let service: BaytService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaytModule],
    }).compile();

    service = module.get<BaytService>(BaytService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BAYT],
      searchTerm: 'engineer',
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
    }
  });
});
