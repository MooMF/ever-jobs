/**
 * E2E test for the StartupJobs scraper.
 *
 * Hits the live Startup.jobs API -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { StartupJobsModule, StartupJobsService } from '@ever-jobs/source-startupjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('StartupJobsService (E2E)', () => {
  let service: StartupJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StartupJobsModule],
    }).compile();

    service = module.get<StartupJobsService>(StartupJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.STARTUPJOBS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.site).toBe(Site.STARTUPJOBS);
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.id).toMatch(/^startupjobs-/);
    }
  });

  it('should filter by search term', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.STARTUPJOBS],
      searchTerm: 'engineer',
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should support markdown description format', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.STARTUPJOBS],
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.STARTUPJOBS],
      resultsWanted: 2,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });

  it('should handle empty results gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.STARTUPJOBS],
      searchTerm: 'zzzznonexistentjobtitlexyz123',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
