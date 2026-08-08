import { ConservationJobsService } from '../src/conservationjobs.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ConservationJobsService (e2e)', () => {
  let service: ConservationJobsService;

  beforeAll(() => {
    service = new ConservationJobsService();
  });

  it('should return jobs from ConservationJobs RSS feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.CONSERVATIONJOBS],
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
      expect(job.site).toBe(Site.CONSERVATIONJOBS);
      expect(job.id).toMatch(/^conservationjobs-/);
    }
  }, 30000);
});
