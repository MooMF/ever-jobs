/**
 * E2E test for the Google scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleModule, GoogleService } from '@ever-jobs/source-google';
import { ScraperInputDto, Site, Country, DescriptionFormat } from '@ever-jobs/models';

describe('GoogleService (E2E)', () => {
  let service: GoogleService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GoogleModule],
    }).compile();

    service = module.get<GoogleService>(GoogleService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GOOGLE],
      searchTerm: 'devops engineer',
      location: 'Chicago',
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
