/**
 * E2E test for the Sólides (solides.com.br) ATS scraper.
 *
 * No authentication required — Sólides tenants publish a public candidate-facing career
 * site at `https://{tenant}.vagas.solides.com.br/`. The site is a client-rendered
 * Next.js SPA whose open roles are fetched from the platform's public JSON API gateway
 * `https://apigw.solides.com.br/jobs/v3/home/vacancy?slug={tenant}&take=&page=`, which
 * the adapter calls directly; each vacancy's numeric `id` builds the canonical detail
 * URL `https://{tenant}.vagas.solides.com.br/vaga/{id}`. The adapter resolves the tenant
 * from a `companySlug` (the company slug, e.g. `solides`) or a full `companyUrl`. Tests
 * run against a known Sólides-powered tenant but tolerate upstream changes / empty boards
 * by treating zero results as acceptable; the shape assertions only run when jobs are
 * actually returned.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SolidesModule, SolidesService } from '@ever-jobs/source-ats-solides';
import { ScraperInputDto, Site, DescriptionFormat } from '@ever-jobs/models';

// Public Sólides-powered career site (Sólides Tecnologia — confirmed live 2026-06-03).
const KNOWN_TENANT = 'solides';

describe('SolidesService (E2E)', () => {
  let service: SolidesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SolidesModule],
    }).compile();

    service = module.get<SolidesService>(SolidesService);
  });

  it('should return job results for a known Solides tenant', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOLIDES],
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
      expect(job.site).toBe(Site.SOLIDES);
      expect(job.atsType).toBe('solides');
      expect(job.atsId).toBeDefined();
      expect(job.jobUrl).toBeDefined();
    }
  }, 30000);

  it('should return empty results when neither companySlug nor companyUrl is provided', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOLIDES],
      resultsWanted: 5,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBe(0);
  });

  it('should resolve a tenant from a full companyUrl', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOLIDES],
      companyUrl: `https://${KNOWN_TENANT}.vagas.solides.com.br/`,
      resultsWanted: 3,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
  }, 30000);

  it('should handle an unknown tenant gracefully', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.SOLIDES],
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
      siteType: [Site.SOLIDES],
      companySlug: KNOWN_TENANT,
      resultsWanted: 3,
      descriptionFormat: DescriptionFormat.PLAIN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs.length).toBeLessThanOrEqual(3);
  }, 30000);
});
