import { UndpJobsService } from '../src/undpjobs.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('UndpJobsService (e2e)', () => {
  let service: UndpJobsService;

  beforeAll(() => {
    service = new UndpJobsService();
  });

  it('should return jobs from UNDP Jobs RSS feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.UNDPJOBS],
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
      expect(job.site).toBe(Site.UNDPJOBS);
      expect(job.id).toMatch(/^undpjobs-/);
    }
  }, 30000);
});
