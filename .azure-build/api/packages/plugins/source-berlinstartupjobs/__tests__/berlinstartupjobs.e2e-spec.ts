import { BerlinStartupJobsService } from '../src/berlinstartupjobs.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('BerlinStartupJobsService (e2e)', () => {
  let service: BerlinStartupJobsService;

  beforeAll(() => {
    service = new BerlinStartupJobsService();
  });

  it('should return jobs from Berlin Startup Jobs RSS feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.BERLINSTARTUPJOBS],
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
      expect(job.site).toBe(Site.BERLINSTARTUPJOBS);
      expect(job.id).toMatch(/^berlinstartupjobs-/);
    }
  }, 30000);
});
