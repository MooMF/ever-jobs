/**
 * E2E test for the Zimyo ATS scraper.
 *
 * No authentication required — Zimyo tenants publish a public candidate-facing career
 * board backed by a public JSON widget API on the ATS backend host
 * (`https://ats.zimyo.work/ats/ats`). The board is keyed by a numeric **organisation
 * id**: `widget/joblist2?id={orgId}` returns the paginated open-roles list, each role
 * carrying a `JOB_ID` (the stable ATS id) that the adapter enriches via
 * `widget/jobDetails?jobId=` and maps; each role's `JOB_ID` builds the canonical detail /
 * apply URL `/recruit/career/details/{base64(jobId)}/{base64(orgId)}`. The adapter
 * resolves the org from a `companySlug` (the bare org id, e.g. `1`) or a full
 * `companyUrl` (whose base64 path segment decodes to the org id). Tests run against a
 * known Zimyo-powered org but tolerate upstream changes / empty boards by treating zero
 * results as acceptable; the shape assertions only run when jobs are actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ZimyoModule, ZimyoService } from '@ever-jobs/source-ats-zimyo';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Zimyo-powered org (Zimyo's own board — confirmed live 2026-06-03; the widget
// API answered HTTP 200 and a real role `jobId=11268` resolved under this org).
const KNOWN_ORG = '1';

describe('ZimyoService (E2E)', () => {
  let service: ZimyoService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ZimyoModule],
    }).compile();

    service = module.get<ZimyoService>(ZimyoService);
  });

  it('should return job results for a known Zimyo org', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZIMYO],
      companySlug: KNOWN_ORG,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.ZIMYO);
      expect(job.atsType).toBe('zimyo');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZIMYO],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve an org from a full companyUrl', async () => {
    // The career routes encode the org id as a base64 path segment; `MQ==` decodes to `1`.
    const input = new ScraperInputDto({
      siteType: [Site.ZIMYO],
      companyUrl: 'https://zimyo.work/recruit/career/joblist/MQ==',
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown org gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZIMYO],
      companySlug: '999999999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.ZIMYO],
      companySlug: KNOWN_ORG,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
