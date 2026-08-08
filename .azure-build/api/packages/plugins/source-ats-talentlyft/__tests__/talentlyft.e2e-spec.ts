/**
 * E2E test for the TalentLyft scraper.
 *
 * Tests authenticated API scraping.
 * To run tests, set TALENTLYFT_API_KEY env var.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TalentLyftModule, TalentLyftService } from '@ever-jobs/source-ats-talentlyft';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('TalentLyftService (E2E)', () => {
  let service: TalentLyftService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TalentLyftModule],
    }).compile();

    service = module.get<TalentLyftService>(TalentLyftService);
  });

  it('should return job results when API key is set', async () => {
    const apiKey = process.env.TALENTLYFT_API_KEY;
    if (!apiKey) {
      console.log('Skipping test: TALENTLYFT_API_KEY not set');
      return;
    }

    const input = new ScraperInputDto({
      siteType: [Site.TALENTLYFT],
      companySlug: 'test-company',
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
      expect(job.site).toBe(Site.TALENTLYFT);
      expect(job.atsType).toBe('talentlyft');
      expect(job.atsId).toBeDefined();
    }
  });

  it('should return empty results when no API key is set', async () => {
    const originalKey = process.env.TALENTLYFT_API_KEY;
    delete process.env.TALENTLYFT_API_KEY;

    try {
      const input = new ScraperInputDto({
        siteType: [Site.TALENTLYFT],
        companySlug: 'test-company',
        resultsWanted: 5,
      });

      const response = await service.scrape(input);

      expect(response).toBeDefined();
      expect(response.jobs).toBeDefined();
      expect(response.jobs.length).toBe(0);
    } finally {
      if (originalKey) {
        process.env.TALENTLYFT_API_KEY = originalKey;
      }
    }
  });

  it('should return empty results when no companySlug provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.TALENTLYFT],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should respect resultsWanted limit', async () => {
    const apiKey = process.env.TALENTLYFT_API_KEY;
    if (!apiKey) {
      console.log('Skipping test: TALENTLYFT_API_KEY not set');
      return;
    }

    const input = new ScraperInputDto({
      siteType: [Site.TALENTLYFT],
      companySlug: 'test-company',
      resultsWanted: 2,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(2);
  });
});
