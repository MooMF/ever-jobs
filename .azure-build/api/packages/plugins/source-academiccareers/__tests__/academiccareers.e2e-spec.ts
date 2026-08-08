import { Test, TestingModule } from '@nestjs/testing';
import { AcademiccareersModule, AcademiccareersService } from '@ever-jobs/source-academiccareers';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('AcademiccareersService (E2E)', () => {
  let service: AcademiccareersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AcademiccareersModule],
    }).compile();

    service = module.get<AcademiccareersService>(AcademiccareersService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ACADEMICCAREERS],
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
      expect(job.site).toBe(Site.ACADEMICCAREERS);
      expect(job.id).toMatch(/^academiccareers-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ACADEMICCAREERS],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);

  it('should handle search term filtering', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ACADEMICCAREERS],
      searchTerm: 'professor',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);
});
