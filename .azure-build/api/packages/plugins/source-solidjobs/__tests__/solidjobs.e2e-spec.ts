/**
 * E2E test for the Solid.Jobs scraper.
 *
 * solid.jobs is a Polish job board with mandatory salary transparency.
 * Uses a free public JSON API -- no authentication required (the
 * `campaign` query parameter is mandatory and fixed to `api`).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';
import { SolidJobsModule } from '../src/solidjobs.module';
import { SolidJobsService } from '../src/solidjobs.service';

describe('SolidJobsService (E2E)', () => {
  let service: SolidJobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SolidJobsModule],
    }).compile();

    service = module.get<SolidJobsService>(SolidJobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOLIDJOBS],
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.SOLIDJOBS);
      expect(job.id).toMatch(/^solidjobs-/);
      expect(job.jobUrl).toBeDefined();
      expect(job.jobUrl).toContain('solid.jobs/o/');
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOLIDJOBS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOLIDJOBS],
      searchTerm: 'developer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
