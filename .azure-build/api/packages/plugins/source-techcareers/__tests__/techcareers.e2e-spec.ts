import { Test } from '@nestjs/testing';
import { TechcareersModule, TechcareersService } from '../src';
import { Site } from '@ever-jobs/models';

describe('TechcareersService (e2e)', () => {
  let service: TechcareersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TechcareersModule],
    }).compile();
    service = module.get(TechcareersService);
  });

  it('should return jobs from TechCareers', async () => {
    const result = await service.scrape({
      siteType: [Site.TECHCAREERS],
      searchTerm: 'software engineer',
      resultsWanted: 5,
    });
    console.log(`TechCareers returned ${result.jobs.length} jobs`);
    expect(result).toBeDefined();
    expect(result.jobs).toBeInstanceOf(Array);
  }, 30_000);
});
