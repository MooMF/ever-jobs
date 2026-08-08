import { CoroflotService } from '../src/coroflot.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('CoroflotService (e2e)', () => {
  let service: CoroflotService;

  beforeAll(() => {
    service = new CoroflotService();
  });

  it('should return jobs from Coroflot RSS feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.COROFLOT],
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const result = await service.scrape(input);

    expect(result).toBeDefined();
    expect(result.jobs).toBeDefined();
    expect(Array.isArray(result.jobs)).toBe(true);

    if (result.jobs.length > 0) {
      const job = result.jobs[0];
      expect(job.title).toBeDefined();
      expect(job.jobUrl).toBeDefined();
      expect(job.site).toBe(Site.COROFLOT);
      expect(job.id).toMatch(/^coroflot-/);
    }
  }, 30000);
});
