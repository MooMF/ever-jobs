import { Test } from '@nestjs/testing';
import { EcojobsModule, EcojobsService } from '../src';
import { Site } from '@ever-jobs/models';

describe('EcojobsService (e2e)', () => {
  let service: EcojobsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [EcojobsModule],
    }).compile();
    service = module.get(EcojobsService);
  });

  it('should return jobs from EcoJobs RSS feed', async () => {
    const result = await service.scrape({
      siteType: [Site.ECOJOBS],
      searchTerm: 'environmental',
      resultsWanted: 5,
    });
    console.log(`EcoJobs returned ${result.jobs.length} jobs`);
    expect(result).toBeDefined();
    expect(result.jobs).toBeInstanceOf(Array);
  }, 30_000);
});
