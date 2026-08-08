/**
 * E2E test for the GermanTechJobs scraper.
 *
 * GermanTechJobs is a German IT/tech job board with salary transparency.
 * No authentication required -- the RSS feed is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GermantechjobsModule, GermantechjobsService } from '@ever-jobs/source-germantechjobs';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('GermantechjobsService (E2E)', () => {
  let service: GermantechjobsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GermantechjobsModule],
    }).compile();

    service = module.get<GermantechjobsService>(GermantechjobsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GERMANTECHJOBS],
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
      expect(job.site).toBe(Site.GERMANTECHJOBS);
      expect(job.id).toMatch(/^germantechjobs-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GERMANTECHJOBS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GERMANTECHJOBS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
