/**
 * E2E test for the Functional Works scraper.
 *
 * Functional Works is a functional programming job board (Haskell, Clojure, Scala, etc.).
 * Uses a public GraphQL API -- no authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FunctionalworksModule, FunctionalworksService } from '@ever-jobs/source-functionalworks';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('FunctionalworksService (E2E)', () => {
  let service: FunctionalworksService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FunctionalworksModule],
    }).compile();

    service = module.get<FunctionalworksService>(FunctionalworksService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FUNCTIONALWORKS],
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
      expect(job.site).toBe(Site.FUNCTIONALWORKS);
      expect(job.id).toMatch(/^functionalworks-/);
      expect(job.jobUrl).toBeDefined();
      expect(job.jobUrl).toContain('functional.works-hub.com/jobs/');
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FUNCTIONALWORKS],
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.FUNCTIONALWORKS],
      searchTerm: 'haskell',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
