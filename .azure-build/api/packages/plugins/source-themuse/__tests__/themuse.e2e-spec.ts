/**
 * E2E test for the TheMuse scraper.
 *
 * Uses the public TheMuse API (no auth required).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TheMuseModule, TheMuseService } from '@ever-jobs/source-themuse';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('TheMuseService (E2E)', () => {
  let service: TheMuseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TheMuseModule],
    }).compile();

    service = module.get<TheMuseService>(TheMuseService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.THEMUSE],
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
      expect(job.site).toBe(Site.THEMUSE);
      expect(job.id).toMatch(/^themuse-/);
      expect(job.jobUrl).toBeDefined();
    }
  });

  it('should return results without search term', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.THEMUSE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });

  it('should handle location filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.THEMUSE],
      location: 'New York',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  });
});
