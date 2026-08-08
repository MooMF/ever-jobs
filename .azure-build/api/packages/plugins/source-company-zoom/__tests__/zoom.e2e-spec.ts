/**
 * E2E test for the Zoom scraper.
 *
 * Uses the Eightfold PCSX API (no auth required).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ZoomModule, ZoomService } from '@ever-jobs/source-company-zoom';
import { ScraperInputDto, Site } from '@ever-jobs/models';

describe('ZoomService (E2E)', () => {
  let service: ZoomService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ZoomModule],
    }).compile();

    service = module.get<ZoomService>(ZoomService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZOOM],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.ZOOM);
      expect(job.companyName).toBe('Zoom');
    }
  });

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZOOM],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  });

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZOOM],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
