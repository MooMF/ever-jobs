import { Test, TestingModule } from '@nestjs/testing';
import { CanadaJobBankModule, CanadaJobBankService } from '@ever-jobs/source-canadajobbank';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CanadaJobBankService (E2E)', () => {
  let service: CanadaJobBankService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CanadaJobBankModule],
    }).compile();

    service = module.get<CanadaJobBankService>(CanadaJobBankService);
  });

  it('should return job results', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CANADAJOBBANK],
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
      expect(job.site).toBe(Site.CANADAJOBBANK);
      expect(job.id).toMatch(/^canadajobbank-/);
    }
  }, 30000);

  it('should respect resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CANADAJOBBANK],
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
