/**
 * E2E test for the Web3Career scraper.
 *
 * Web3.career is a blockchain/Web3/crypto job board.
 * No authentication required -- the API is public.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Web3CareerModule, Web3CareerService } from '@ever-jobs/source-web3career';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('Web3CareerService (E2E)', () => {
  let service: Web3CareerService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [Web3CareerModule],
    }).compile();

    service = module.get<Web3CareerService>(Web3CareerService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WEB3CAREER],
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
      expect(job.site).toBe(Site.WEB3CAREER);
      expect(job.id).toMatch(/^web3career-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WEB3CAREER],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.WEB3CAREER],
      searchTerm: 'solidity',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
