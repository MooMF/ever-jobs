/**
 * E2E test for the HeadHunter scraper.
 *
 * HeadHunter (hh.ru) is a Russian/CIS job board with a public JSON API.
 * No authentication required -- the API is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HeadhunterModule, HeadhunterService } from '@ever-jobs/source-headhunter';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('HeadhunterService (E2E)', () => {
  let service: HeadhunterService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HeadhunterModule],
    }).compile();

    service = module.get<HeadhunterService>(HeadhunterService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HEADHUNTER],
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
      expect(job.site).toBe(Site.HEADHUNTER);
      expect(job.id).toMatch(/^headhunter-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HEADHUNTER],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HEADHUNTER],
      searchTerm: 'developer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
