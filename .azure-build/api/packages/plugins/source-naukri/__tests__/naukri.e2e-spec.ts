/**
 * E2E test for the Naukri scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NaukriModule, NaukriService } from '@ever-jobs/source-naukri';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('NaukriService (E2E)', () => {
  let service: NaukriService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NaukriModule],
    }).compile();

    service = module.get<NaukriService>(NaukriService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.NAUKRI],
      searchTerm: 'developer',
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
