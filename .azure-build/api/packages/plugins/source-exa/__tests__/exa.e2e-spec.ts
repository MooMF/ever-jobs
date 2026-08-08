/**
 * E2E test for the Exa scraper.
 *
 * NOTE: Requires EXA_API_KEY environment variable to be set.
 * Without it, the service returns empty results gracefully.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ExaModule, ExaService } from '@ever-jobs/source-exa';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ExaService (E2E)', () => {
  let service: ExaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ExaModule],
    }).compile();

    service = module.get<ExaService>(ExaService);
  });

  it('should return job results when EXA_API_KEY is set', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.EXA],
      searchTerm: 'software engineer',
      location: 'Remote',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (process.env.EXA_API_KEY) {
      // With an API key, we expect at least some results
      expect(response.jobs.length).toBeGreaterThan(0);
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.EXA);
      expect(job.jobUrl).toBeDefined();
    } else {
      // Without API key, should return empty gracefully
      expect(response.jobs.length).toBe(0);
    }
  });
});
