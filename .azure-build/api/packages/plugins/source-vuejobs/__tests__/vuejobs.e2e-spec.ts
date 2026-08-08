import { VueJobsService } from '../src/vuejobs.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('VueJobsService (e2e)', () => {
  let service: VueJobsService;

  beforeAll(() => {
    service = new VueJobsService();
  });

  it('should return jobs from VueJobs RSS feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.VUEJOBS],
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
      expect(job.site).toBe(Site.VUEJOBS);
      expect(job.id).toMatch(/^vuejobs-/);
    }
  }, 30000);
});
