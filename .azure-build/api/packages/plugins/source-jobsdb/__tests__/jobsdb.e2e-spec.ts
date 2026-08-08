import { Test } from '@nestjs/testing';
import { JobsdbModule, JobsdbService } from '../src';
import { Site } from '@ever-jobs/models';

describe('JobsdbService (e2e)', () => {
  let service: JobsdbService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [JobsdbModule],
    }).compile();
    service = module.get(JobsdbService);
  });

  it('should return jobs from JobsDB', async () => {
    const result = await service.scrape({
      siteType: [Site.JOBSDB],
      searchTerm: 'software engineer',
      resultsWanted: 5,
    });
    console.log(`JobsDB returned ${result.jobs.length} jobs`);
    expect(result).toBeDefined();
    expect(result.jobs).toBeInstanceOf(Array);
  }, 30_000);
});
