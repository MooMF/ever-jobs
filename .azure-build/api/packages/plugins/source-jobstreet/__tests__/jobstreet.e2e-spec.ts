/**
 * E2E test for the Jobstreet scraper.
 *
 * Jobstreet is a major Southeast Asian job board -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JobstreetModule, JobstreetService } from '@ever-jobs/source-jobstreet';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('JobstreetService (E2E)', () => {
  let service: JobstreetService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobstreetModule],
    }).compile();

    service = module.get<JobstreetService>(JobstreetService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSTREET],
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
      expect(job.site).toBe(Site.JOBSTREET);
      expect(job.id).toMatch(/^jobstreet-/);
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSTREET],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSTREET],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should handle location filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.JOBSTREET],
      searchTerm: 'developer',
      location: 'Kuala Lumpur',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
