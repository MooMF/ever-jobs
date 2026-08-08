import { PyJobsService } from '../src/pyjobs.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('PyJobsService (e2e)', () => {
  let service: PyJobsService;

  beforeAll(() => {
    service = new PyJobsService();
  });

  it('should return jobs from PyJobs RSS feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.PYJOBS],
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
      expect(job.site).toBe(Site.PYJOBS);
      expect(job.id).toMatch(/^pyjobs-/);
    }
  }, 30000);
});
