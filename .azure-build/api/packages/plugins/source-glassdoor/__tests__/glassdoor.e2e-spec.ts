/**
 * E2E test for the Glassdoor scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GlassdoorModule, GlassdoorService } from '@ever-jobs/source-glassdoor';
import { ScraperInputDto, Site, Country, DescriptionFormat } from '@ever-jobs/models';

describe('GlassdoorService (E2E)', () => {
  let service: GlassdoorService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GlassdoorModule],
    }).compile();

    service = module.get<GlassdoorService>(GlassdoorService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GLASSDOOR],
      searchTerm: 'product manager',
      location: 'San Francisco',
      resultsWanted: 5,
      country: Country.USA,
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
