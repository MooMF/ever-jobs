import { DevITJobsService } from '../src/devitjobs.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('DevITJobsService (e2e)', () => {
  let service: DevITJobsService;

  beforeAll(() => {
    service = new DevITJobsService();
  });

  it('should return jobs from DevITjobs feed', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DEVITJOBS],
      searchTerm: 'developer',
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
      expect(job.site).toBe(Site.DEVITJOBS);
      expect(job.id).toMatch(/^devitjobs-/);
    }
  }, 30000);
});
