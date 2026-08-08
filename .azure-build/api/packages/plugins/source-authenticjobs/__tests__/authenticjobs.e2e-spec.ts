/**
 * E2E test for the Authentic Jobs scraper.
 *
 * Requires AUTHENTICJOBS_API_KEY to be set in the environment.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticJobsModule, AuthenticJobsService } from '@ever-jobs/source-authenticjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('AuthenticJobsService (E2E)', () => {
  let service: AuthenticJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthenticJobsModule],
    }).compile();

    service = module.get<AuthenticJobsService>(AuthenticJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AUTHENTICJOBS],
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
      expect(job.site).toBe(Site.AUTHENTICJOBS);
      expect(job.id).toMatch(/^authenticjobs-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AUTHENTICJOBS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.AUTHENTICJOBS],
      searchTerm: 'designer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
