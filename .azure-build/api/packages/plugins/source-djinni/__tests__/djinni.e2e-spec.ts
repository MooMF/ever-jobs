/**
 * E2E test for the Djinni scraper.
 *
 * Djinni is a Ukrainian tech job board with RSS feed.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DjinniModule, DjinniService } from '@ever-jobs/source-djinni';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('DjinniService (E2E)', () => {
  let service: DjinniService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DjinniModule],
    }).compile();

    service = module.get<DjinniService>(DjinniService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DJINNI],
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
      expect(job.site).toBe(Site.DJINNI);
      expect(job.id).toMatch(/^djinni-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DJINNI],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DJINNI],
      searchTerm: 'developer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
