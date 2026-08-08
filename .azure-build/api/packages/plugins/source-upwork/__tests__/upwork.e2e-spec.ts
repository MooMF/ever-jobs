import { Test, TestingModule } from '@nestjs/testing';
import { UpworkModule, UpworkService } from '@ever-jobs/source-upwork';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('UpworkService (e2e)', () => {
  let service: UpworkService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UpworkModule],
    }).compile();

    service = module.get<UpworkService>(UpworkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty results when credentials are missing', async () => {
    // If UPWORK_* env vars are not set, the service should gracefully return empty
    if (!process.env.UPWORK_ACCESS_TOKEN) {
      const input = new ScraperInputDto({
        siteType: [Site.UPWORK],
        searchTerm: 'software engineer',
        resultsWanted: 5,
        descriptionFormat: DescriptionFormat.MARKDOWN,
      });
      const result = await service.scrape(input);
      expect(result).toBeDefined();
      expect(result.jobs).toEqual([]);
    }
  });

  it('should return jobs when credentials are configured', async () => {
    // This test only runs when valid Upwork credentials are available
    if (
      process.env.UPWORK_CLIENT_ID &&
      process.env.UPWORK_CLIENT_SECRET &&
      process.env.UPWORK_ACCESS_TOKEN &&
      process.env.UPWORK_REFRESH_TOKEN
    ) {
      const input = new ScraperInputDto({
        siteType: [Site.UPWORK],
        searchTerm: 'typescript developer',
        resultsWanted: 5,
        descriptionFormat: DescriptionFormat.MARKDOWN,
      });
      const result = await service.scrape(input);
      expect(result).toBeDefined();
      expect(result.jobs.length).toBeGreaterThan(0);
      expect(result.jobs[0].site).toBe(Site.UPWORK);
      expect(result.jobs[0].jobUrl).toContain('upwork.com');
    }
  });
});
