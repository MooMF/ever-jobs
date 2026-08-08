/**
 * E2E test for the WorkingNomads scraper.
 *
 * Uses the public WorkingNomads API (no auth required).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WorkingNomadsModule, WorkingNomadsService } from '@ever-jobs/source-workingnomads';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('WorkingNomadsService (E2E)', () => {
  let service: WorkingNomadsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WorkingNomadsModule],
    }).compile();

    service = module.get<WorkingNomadsService>(WorkingNomadsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKINGNOMADS],
      searchTerm: 'software engineer',
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
      expect(job.site).toBe(Site.WORKINGNOMADS);
      expect(job.id).toMatch(/^workingnomads-/);
      expect(job.jobUrl).toBeDefined();
      expect(job.isRemote).toBe(true);
    }
  });

  it('should return results without search term', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKINGNOMADS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WORKINGNOMADS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
