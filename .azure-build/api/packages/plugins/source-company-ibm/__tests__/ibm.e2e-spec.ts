/**
 * E2E test for the IBM scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { IbmModule, IbmService } from '@ever-jobs/source-company-ibm';
import { ScraperInputDto, Site } from '@ever-jobs/models';

describe('IbmService (E2E)', () => {
  let service: IbmService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [IbmModule],
    }).compile();

    service = module.get<IbmService>(IbmService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.IBM],
      searchTerm: 'software engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.site).toBe(Site.IBM);
      expect(job.companyName).toBe('IBM');
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.jobUrl).toBeDefined();
    }
  });
});
