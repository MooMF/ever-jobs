/**
 * E2E test for the VirtualVocations scraper.
 *
 * VirtualVocations is a remote/work-from-home job board with a public RSS feed.
 * No authentication required.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { VirtualVocationsModule, VirtualVocationsService } from '@ever-jobs/source-virtualvocations';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('VirtualVocationsService (E2E)', () => {
  let service: VirtualVocationsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VirtualVocationsModule],
    }).compile();

    service = module.get<VirtualVocationsService>(VirtualVocationsService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIRTUALVOCATIONS],
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
      expect(job.site).toBe(Site.VIRTUALVOCATIONS);
      expect(job.id).toMatch(/^virtualvocations-/);
      expect(job.jobUrl).toBeDefined();
      expect(job.isRemote).toBe(true);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIRTUALVOCATIONS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VIRTUALVOCATIONS],
      searchTerm: 'engineer',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
