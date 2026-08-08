/**
 * E2E test for the Internshala scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { InternshalaModule, InternshalaService } from '@ever-jobs/source-internshala';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('InternshalaService (E2E)', () => {
  let service: InternshalaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [InternshalaModule],
    }).compile();

    service = module.get<InternshalaService>(InternshalaService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.INTERNSHALA],
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
