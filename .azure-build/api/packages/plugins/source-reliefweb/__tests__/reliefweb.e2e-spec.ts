import { ReliefWebService } from '../src/reliefweb.service';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('ReliefWebService (e2e)', () => {
  let service: ReliefWebService;

  beforeAll(() => {
    service = new ReliefWebService();
  });

  it('should return jobs from ReliefWeb API', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.RELIEFWEB],
      searchTerm: 'humanitarian',
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
      expect(job.site).toBe(Site.RELIEFWEB);
      expect(job.id).toMatch(/^reliefweb-/);
    }
  }, 30000);
});
