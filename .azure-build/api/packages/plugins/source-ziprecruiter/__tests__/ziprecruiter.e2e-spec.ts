/**
 * E2E test for the ZipRecruiter scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ZipRecruiterModule, ZipRecruiterService } from '@ever-jobs/source-ziprecruiter';
import { ScraperInputDto, Site, Country, DescriptionFormat } from '@ever-jobs/models';

describe('ZipRecruiterService (E2E)', () => {
  let service: ZipRecruiterService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ZipRecruiterModule],
    }).compile();

    service = module.get<ZipRecruiterService>(ZipRecruiterService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZIP_RECRUITER],
      searchTerm: 'frontend developer',
      location: 'Austin, TX',
      resultsWanted: 5,
      country: Country.USA,
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
    }
  });
});
