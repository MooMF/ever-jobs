import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import {
  DescriptionFormat,
  JobResponseDto,
  ScraperInputDto,
  Site,
} from '@ever-jobs/models';

// Mock createHttpClient so the scraper hits a controlled fixture
// pipeline instead of jobs.gem.com (er, join.com).
const mockGet = jest.fn();
const mockSetHeaders = jest.fn();
jest.mock('@ever-jobs/common', () => {
  const actual = jest.requireActual('@ever-jobs/common');
  return {
    ...actual,
    createHttpClient: jest.fn(() => ({
      get: mockGet,
      setHeaders: mockSetHeaders,
    })),
  };
});

import { JoinComModule, JoinComService } from '../src';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const COMPANY_HTML_PRIMARY = fs.readFileSync(
  path.join(FIXTURE_DIR, 'joincom-company-page.html'),
  'utf8',
);
const COMPANY_HTML_FALLBACK = fs.readFileSync(
  path.join(FIXTURE_DIR, 'joincom-company-page-fallback.html'),
  'utf8',
);
const COMPANY_HTML_NO_ID = fs.readFileSync(
  path.join(FIXTURE_DIR, 'joincom-company-page-no-id.html'),
  'utf8',
);
const JOBS_PAGE_RAW = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'joincom-jobs-page-1.json'), 'utf8'),
);

/**
 * Spec 006 / T08 — `JoinComService` REST two-step unit tests.
 *
 * The fixture set covers three HTML shapes (primary `"company":{"id":...`
 * regex, fallback `"companyId":...` regex, no-id 404 page) and one
 * JSON jobs page (2 postings, total=3, totalPages=2 — exercises
 * mid-pagination behaviour).
 *
 * Coverage (≥ 5 mandated by `tasks.md` / T08):
 *   1. **Happy path** — primary regex hits, jobs page returns 2
 *      items, mapped → 2 `JobPostDto` rows with the canonical
 *      `joincom-${id}` id, company name title-cased from slug,
 *      remote detection, department, employmentType, datePosted.
 *   2. **Empty board** — Step 1 hits, jobs page returns
 *      `items: []` → empty `JobResponseDto`, no second page fetched.
 *   3. **HTTP 500 caught** on Step 2 → empty `JobResponseDto`,
 *      no rethrow.
 *   4. **Slug-not-found regex miss** — neither primary nor
 *      fallback regex hits → empty `JobResponseDto`, no Step 2.
 *   5. **`resultsWanted=1` mid-page cap** — happy fixture has 2
 *      postings; cap fires after the first.
 *   6. **Fallback regex hits** when the primary doesn't —
 *      `"companyId":4242` shape resolves the tenant.
 *   7. **`DescriptionFormat.PLAIN`** strips the embedded HTML.
 *   8. **HTTP 500 on Step 1** → empty `JobResponseDto`, never
 *      hits Step 2.
 *
 * Plus 3 carry-over scaffolding cases (T02 → T08):
 *   9. NestJS DI resolution via `JoinComModule`.
 *  10. `Site.JOIN_COM === 'join_com'` literal pin.
 *  11. Missing `companySlug` → empty `JobResponseDto`, no
 *      `mockGet` invocation.
 *
 * 11 cases total.
 */

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

describe('JoinComService — Spec 006 / T07 + T08', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSetHeaders.mockReset();
  });

  describe('registration scaffolding (carries forward from T02)', () => {
    it('resolves through JoinComModule via NestJS DI', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [JoinComModule],
      }).compile();
      const service = moduleRef.get(JoinComService);
      expect(service).toBeInstanceOf(JoinComService);
      await moduleRef.close();
    });

    it('exports the Site.JOIN_COM = "join_com" enum value', () => {
      expect(Site.JOIN_COM).toBe('join_com');
    });

    it('returns empty JobResponseDto when companySlug is unset', async () => {
      const service = new JoinComService();
      const result = await service.scrape({} as ScraperInputDto);
      expect(result).toBeInstanceOf(JobResponseDto);
      expect(result.jobs).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('happy path — primary regex + 2 postings', () => {
    it('extracts companyId via primary regex and maps both items to JobPostDto', async () => {
      mockGet
        .mockResolvedValueOnce({ data: COMPANY_HTML_PRIMARY })
        .mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new JoinComService();
      const input: ScraperInputDto = {
        siteType: [Site.JOIN_COM],
        companySlug: 'acme-corp',
        resultsWanted: 100,
      } as ScraperInputDto;

      const result = await service.scrape(input);
      expect(result).toBeInstanceOf(JobResponseDto);
      // Page 1 has 2 items; pagination says totalPages=2 but total=3.
      // Step 2 makes one more request and gets [] → loop terminates.
      // For the happy-path test we expect 2 (only page 1's items).
      // The fixture's pagination has totalPages=2, so the parser
      // tries page 2; we feed only one fixture, so page 2 throws
      // (mockGet has no third entry) — but the third call would be
      // a "rejection" inside the parser's catch, which breaks the
      // loop after collecting page 1's 2 items.
      // → 2 jobs total.

      expect(result.jobs).toHaveLength(2);

      const first = result.jobs[0];
      expect(first.id).toBe('joincom-1001');
      expect(first.title).toBe('Backend Engineer');
      expect(first.companyName).toBe('Acme Corp');
      expect(first.atsType).toBe('join_com');
      expect(first.atsId).toBe('1001');
      expect(first.site).toBe(Site.JOIN_COM);
      expect(first.jobUrl).toBe(
        'https://join.com/companies/acme-corp/jobs/1001-backend-engineer',
      );
      expect(first.location?.city).toBe('Berlin');
      expect(first.department).toBe('Engineering');
      expect(first.isRemote).toBe(false);
      expect(first.employmentType).toBe('FULL_TIME');
      expect(first.datePosted).toBe('2026-04-20T10:30:00.000Z');

      // Remote-detection sanity check on the designer row.
      const designer = result.jobs.find((j) => j.atsId === '1002');
      expect(designer?.isRemote).toBe(true);
      // Falls back to category.name when department is undefined.
      expect(designer?.department).toBe('Design');

      // Step 1 URL is `/companies/<slug>`; Step 2 URL is the API
      // endpoint with the resolved numeric companyId.
      const calledUrls = mockGet.mock.calls.map((c) => c[0] as string);
      expect(calledUrls[0]).toBe('https://join.com/companies/acme-corp');
      expect(calledUrls[1]).toContain('/api/public/companies/9876/jobs');
      expect(calledUrls[1]).toContain('locale=en-us');
      expect(calledUrls[1]).toContain('pageSize=50');
    });

    it('honours resultsWanted=1 against a 2-item page', async () => {
      mockGet
        .mockResolvedValueOnce({ data: COMPANY_HTML_PRIMARY })
        .mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new JoinComService();
      const input: ScraperInputDto = {
        siteType: [Site.JOIN_COM],
        companySlug: 'acme-corp',
        resultsWanted: 1,
      } as ScraperInputDto;

      const result = await service.scrape(input);
      expect(result.jobs).toHaveLength(1);
      // Only Step 1 + one Step 2 call; the cap fires before page 2
      // would be requested.
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('fallback regex', () => {
    it('extracts companyId=4242 via fallback regex when primary doesn\'t match', async () => {
      const emptyPage = clone(JOBS_PAGE_RAW);
      (emptyPage as any).items = [];
      mockGet
        .mockResolvedValueOnce({ data: COMPANY_HTML_FALLBACK })
        .mockResolvedValueOnce({ data: emptyPage });

      const service = new JoinComService();
      const input: ScraperInputDto = {
        siteType: [Site.JOIN_COM],
        companySlug: 'foobar',
      } as ScraperInputDto;

      const result = await service.scrape(input);
      expect(result.jobs).toEqual([]);
      // Step 2 URL must use the fallback's id (4242), not anything
      // synthesised.
      const step2Url = mockGet.mock.calls[1]?.[0] as string;
      expect(step2Url).toContain('/api/public/companies/4242/jobs');
    });
  });

  describe('empty board', () => {
    it('returns empty JobResponseDto when items[]=[] on first page', async () => {
      const empty = clone(JOBS_PAGE_RAW);
      (empty as any).items = [];
      mockGet
        .mockResolvedValueOnce({ data: COMPANY_HTML_PRIMARY })
        .mockResolvedValueOnce({ data: empty });

      const service = new JoinComService();
      const result = await service.scrape({
        siteType: [Site.JOIN_COM],
        companySlug: 'acme-corp',
      } as ScraperInputDto);

      expect(result.jobs).toEqual([]);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('HTTP failures', () => {
    it('catches a Step 1 HTTP 500 → empty JobResponseDto, no Step 2', async () => {
      mockGet.mockRejectedValueOnce(new Error('Request failed with status 500'));
      const service = new JoinComService();
      const result = await service.scrape({
        siteType: [Site.JOIN_COM],
        companySlug: 'acme-corp',
      } as ScraperInputDto);
      expect(result.jobs).toEqual([]);
      // Only the Step 1 attempt happened.
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('catches a Step 2 HTTP 500 → empty JobResponseDto, never throws', async () => {
      mockGet
        .mockResolvedValueOnce({ data: COMPANY_HTML_PRIMARY })
        .mockRejectedValueOnce(new Error('Request failed with status 500'));
      const service = new JoinComService();
      await expect(
        service.scrape({
          siteType: [Site.JOIN_COM],
          companySlug: 'acme-corp',
        } as ScraperInputDto),
      ).resolves.toBeInstanceOf(JobResponseDto);
    });
  });

  describe('slug-not-found (regex miss)', () => {
    it('returns empty JobResponseDto when neither primary nor fallback regex hits', async () => {
      mockGet.mockResolvedValueOnce({ data: COMPANY_HTML_NO_ID });
      const service = new JoinComService();
      const result = await service.scrape({
        siteType: [Site.JOIN_COM],
        companySlug: 'unknown',
      } as ScraperInputDto);
      expect(result.jobs).toEqual([]);
      // Step 2 was never reached.
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('descriptionFormat = PLAIN', () => {
    it('strips embedded HTML from item.description', async () => {
      mockGet
        .mockResolvedValueOnce({ data: COMPANY_HTML_PRIMARY })
        .mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new JoinComService();
      const result = await service.scrape({
        siteType: [Site.JOIN_COM],
        companySlug: 'acme-corp',
        descriptionFormat: DescriptionFormat.PLAIN,
      } as ScraperInputDto);

      const first = result.jobs[0];
      // Plain-text projection must not contain the original tags.
      expect(first.description).not.toContain('<p>');
      expect(first.description).not.toContain('<strong>');
      expect(first.description).not.toContain('<ul>');
      // But preserves the textual content.
      expect(first.description).toContain('backend engineer');
    });
  });
});
