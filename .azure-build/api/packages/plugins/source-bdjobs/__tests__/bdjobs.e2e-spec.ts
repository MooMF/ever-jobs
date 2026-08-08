/**
 * E2E test for the BDJobs scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BDJobsModule, BDJobsService } from '@ever-jobs/source-bdjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('BDJobsService (E2E)', () => {
  let service: BDJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BDJobsModule],
    }).compile();

    service = module.get<BDJobsService>(BDJobsService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BDJOBS],
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
