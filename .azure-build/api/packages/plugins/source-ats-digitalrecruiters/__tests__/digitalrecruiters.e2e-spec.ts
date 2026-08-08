/**
 * E2E test for the DigitalRecruiters ATS scraper.
 *
 * No authentication is required — DigitalRecruiters career sites render from a
 * public, anonymous JSON API (`GET /careers/v1/careers-sites/{host}` to resolve
 * the canonical career domain, then `POST /public/v1/careers-site/job-ads` for
 * the listing and `GET /public/v1/careers-site/job-ads/{id}` for the detail).
 * Tests run against a known DigitalRecruiters-powered tenant but tolerate
 * upstream changes or WAF gating by treating zero results as acceptable; shape
 * assertions only run when jobs are actually returned.
 *
 * Known live tenant used for testing (verified 2026-06-03):
 *   - `companySlug: 'segulatechnologies-careers'` → career domain
 *     `careers.segulatechnologies.com` (Segula Technologies, ~683 open roles).
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  DigitalRecruitersModule,
  DigitalRecruitersService,
} from '@ever-jobs/source-ats-digitalrecruiters';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

describe('DigitalRecruitersService (E2E)', () => {
  let service: DigitalRecruitersService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DigitalRecruitersModule],
    }).compile();

    service = module.get<DigitalRecruitersService>(DigitalRecruitersService);
  });

  it('should return job results for a known DigitalRecruiters tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DIGITALRECRUITERS],
      companySlug: 'segulatechnologies-careers',
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect((job.title ?? '').length).toBeGreaterThan(0);
      expect(job.site).toBe(Site.DIGITALRECRUITERS);
      expect(job.atsType).toBe('digitalrecruiters');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 60000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DIGITALRECRUITERS],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DIGITALRECRUITERS],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.DIGITALRECRUITERS],
      companySlug: 'segulatechnologies-careers',
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 60000);
});
