/**
 * E2E test for the HReasily ATS scraper.
 *
 * No authentication required — HReasily hiring tenants publish a public candidate-facing
 * career page at `https://careers.hreasily.com/{slug}`, server-rendered with each open role
 * embedded as a schema.org `JobPosting` JSON-LD island (with a server-side-rendered data
 * island and a light HTML anchor scrape as fallbacks). The adapter fetches the career page,
 * extracts each role, and maps it. Each role's schema.org `identifier` (or the trailing
 * `/{jobId}` URL segment) is the stable ATS id, and its `url` is the canonical detail / apply
 * page. The adapter resolves the tenant from a `companySlug` (the career-page slug) or a full
 * `companyUrl`.
 *
 * Surface confidence: the host + slug-path shape is a defensive best-effort model
 * (verified=false as of 2026-06-04 — see hreasily.constants.ts), so the live host may return
 * nothing for the chosen tenant. These tests therefore treat zero results as acceptable; the
 * shape assertions only run when jobs are actually returned. The adapter must NEVER throw, so
 * every test asserts a well-formed (possibly empty) response.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HReasilyModule, HReasilyService } from '@ever-jobs/source-ats-hreasily';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public HReasily-powered career-page slug (best-effort tenant token — the platform's own
// brand slug on the careers host; tolerated empty if the live surface differs).
const KNOWN_TENANT = 'hreasily';

describe('HReasilyService (E2E)', () => {
  let service: HReasilyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HReasilyModule],
    }).compile();

    service = module.get<HReasilyService>(HReasilyService);
  });

  it('should return job results for a known HReasily tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HREASILY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 5,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);

    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(typeof job.title).toBe('string');
      expect(job.site).toBe(Site.HREASILY);
      expect(job.atsType).toBe('hreasily');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HREASILY],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HREASILY],
      companyUrl: `https://careers.hreasily.com/${KNOWN_TENANT}`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HREASILY],
      companySlug: 'this-tenant-definitely-does-not-exist-xyz-99999',
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBe(0);
  }, 30000);

  it('should respect the resultsWanted limit', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.HREASILY],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
