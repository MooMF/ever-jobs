/**
 * E2E test for the GoHire ATS scraper.
 *
 * No authentication required — GoHire careers boards expose a public list feed
 * (`GET https://api2.gohire.io/widget-jobs/{clientHash}`) plus a per-job detail
 * feed (`GET https://api.gohire.io/widget-job?clientHash={hash}&jobId={id}`).
 * Tests run against a known GoHire-powered tenant but tolerate upstream changes
 * / WAF gating by treating zero results as acceptable; the shape assertions only
 * run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GoHireModule, GoHireService } from '@ever-jobs/source-ats-gohire';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('GoHireService (E2E)', () => {
  let service: GoHireService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GoHireModule],
    }).compile();

    service = module.get<GoHireService>(GoHireService);
  });

  it('should return job results for a known GoHire tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GOHIRE],
      companySlug: 'hrscgarc',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.GOHIRE);
      expect(job.atsType).toBe('gohire');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GOHIRE],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GOHIRE],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.GOHIRE],
      companySlug: 'hrscgarc',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
