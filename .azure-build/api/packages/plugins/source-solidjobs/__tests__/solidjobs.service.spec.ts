import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CompensationInterval,
  DescriptionFormat,
  JobResponseDto,
  JobType,
  ScraperInputDto,
  Site,
} from '@ever-jobs/models';

const mockGet = jest.fn();
jest.mock('@ever-jobs/common', () => {
  const actual = jest.requireActual('@ever-jobs/common');
  return {
    ...actual,
    createHttpClient: jest.fn(() => ({
      get: mockGet,
      setHeaders: jest.fn(),
    })),
  };
});

import { SolidJobsModule } from '../src/solidjobs.module';
import { SolidJobsService } from '../src/solidjobs.service';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const JOBS_PAGE_RAW = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'solidjobs-jobs.json'), 'utf8'),
);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Spec 718 / T06 — `SolidJobsService` unit tests (fixture of 3 real
 * offers captured from the live `it` division on 2026-06-11).
 */
describe('SolidJobsService — Spec 718 / T06', () => {
  beforeEach(() => {
    mockGet.mockReset();
    delete process.env.SOLIDJOBS_DIVISIONS;
  });

  afterAll(() => {
    delete process.env.SOLIDJOBS_DIVISIONS;
  });

  describe('registration scaffolding', () => {
    it('resolves through SolidJobsModule via NestJS DI', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [SolidJobsModule],
      }).compile();
      const service = moduleRef.get(SolidJobsService);
      expect(service).toBeInstanceOf(SolidJobsService);
      await moduleRef.close();
    });

    it('exports Site.SOLIDJOBS = "solidjobs", distinct from Site.SOLIDES', () => {
      expect(Site.SOLIDJOBS).toBe('solidjobs');
      expect(Site.SOLIDES).toBe('solides');
      expect(Site.SOLIDJOBS).not.toBe(Site.SOLIDES);
    });
  });

  describe('happy path', () => {
    it('maps all fixture offers to JobPostDto and hits the campaign URL', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        resultsWanted: 100,
      } as ScraperInputDto);
      const dto = result as JobResponseDto;
      expect(dto.jobs).toHaveLength(3);

      for (let i = 0; i < dto.jobs.length; i++) {
        const wire = JOBS_PAGE_RAW.jobs[i];
        const job = dto.jobs[i];
        expect(job.id).toBe(`solidjobs-${wire.jobOfferKey}`);
        expect(job.title).toBe(wire.title);
        expect(job.jobUrl).toBe(wire.url);
        expect(job.jobUrl).toContain('https://solid.jobs/o/');
        expect(job.companyName).toBe(wire.company);
        expect(job.site).toBe(Site.SOLIDJOBS);
        expect(job.location?.city).toBe(wire.locations[0]);
        expect(job.location?.state ?? null).toBeNull();
        expect(job.location?.country ?? null).toBeNull();
        expect(job.isRemote).toBe(wire.isRemote === true);
      }

      const calledUrls = mockGet.mock.calls.map((c) => c[0] as string);
      expect(calledUrls).toEqual([
        'https://solid.jobs/public-api/offers/it?campaign=api',
      ]);
    });
  });

  describe('salary mapping', () => {
    it('maps the salary object to a monthly PLN CompensationDto', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);

      const wire = JOBS_PAGE_RAW.jobs[0];
      const job = result.jobs.find(
        (j) => j.id === `solidjobs-${wire.jobOfferKey}`,
      );
      expect(job?.compensation).toBeDefined();
      expect(job?.compensation?.minAmount).toBe(wire.salary.from);
      expect(job?.compensation?.maxAmount).toBe(wire.salary.to);
      expect(job?.compensation?.currency).toBe('PLN');
      expect(job?.compensation?.interval).toBe(CompensationInterval.MONTHLY);
    });

    it('maps a null salary to no compensation while still emitting the job', async () => {
      const page = clone(JOBS_PAGE_RAW) as any;
      page.jobs[0].salary = null;
      mockGet.mockResolvedValueOnce({ data: page });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);

      expect(result.jobs).toHaveLength(3);
      const job = result.jobs.find(
        (j) => j.id === `solidjobs-${JOBS_PAGE_RAW.jobs[0].jobOfferKey}`,
      );
      expect(job).toBeDefined();
      expect(job?.compensation ?? null).toBeNull();
    });
  });

  describe('jobType mapping', () => {
    it('resolves full_time and part_time contractTime values', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);

      for (let i = 0; i < result.jobs.length; i++) {
        const wire = JOBS_PAGE_RAW.jobs[i];
        const expected =
          wire.contractTime === 'part_time'
            ? JobType.PART_TIME
            : JobType.FULL_TIME;
        expect(result.jobs[i].jobType).toEqual([expected]);
      }
      // Fixture guarantees both branches are exercised.
      expect(
        JOBS_PAGE_RAW.jobs.some((j: any) => j.contractTime === 'part_time'),
      ).toBe(true);
      expect(
        JOBS_PAGE_RAW.jobs.some((j: any) => j.contractTime === 'full_time'),
      ).toBe(true);
    });
  });

  describe('descriptionFormat', () => {
    it('converts HTML to plain text by default', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);

      const job = result.jobs[0];
      expect(job.description).toBeTruthy();
      expect(job.description).not.toContain('<div');
      expect(job.description).not.toContain('<p>');
      expect(job.description).not.toContain('<li>');
    });

    it('passes raw HTML through when DescriptionFormat.HTML is requested', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        descriptionFormat: DescriptionFormat.HTML,
      } as ScraperInputDto);

      const job = result.jobs[0];
      expect(job.description).toBe(JOBS_PAGE_RAW.jobs[0].description);
      expect(job.description).toContain('<');
    });

    it('converts HTML to markdown when DescriptionFormat.MARKDOWN is requested', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        descriptionFormat: DescriptionFormat.MARKDOWN,
      } as ScraperInputDto);

      const job = result.jobs[0];
      expect(job.description).toBeTruthy();
      // Fixture description carries <strong> headings → markdown bold.
      expect(job.description).toContain('**');
      expect(job.description).not.toContain('<div');
      expect(job.description).not.toContain('<li>');
    });
  });

  describe('searchTerm filter', () => {
    it('matches case-insensitively on title', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });
      const service = new SolidJobsService();
      const term = String(JOBS_PAGE_RAW.jobs[0].title).toLowerCase();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        searchTerm: term,
      } as ScraperInputDto);
      expect(result.jobs.length).toBeGreaterThanOrEqual(1);
      expect(result.jobs.map((j) => j.id)).toContain(
        `solidjobs-${JOBS_PAGE_RAW.jobs[0].jobOfferKey}`,
      );
    });

    it('matches on subCategory', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });
      const service = new SolidJobsService();
      const term = String(JOBS_PAGE_RAW.jobs[1].subCategory).toUpperCase();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        searchTerm: term,
      } as ScraperInputDto);
      expect(result.jobs.map((j) => j.id)).toContain(
        `solidjobs-${JOBS_PAGE_RAW.jobs[1].jobOfferKey}`,
      );
    });

    it('matches on skill names', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });
      const service = new SolidJobsService();
      const skillOffer = JOBS_PAGE_RAW.jobs.find(
        (j: any) => (j.skills ?? []).length > 0,
      );
      const term = String(skillOffer.skills[0].name).toLowerCase();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        searchTerm: term,
      } as ScraperInputDto);
      expect(result.jobs.map((j) => j.id)).toContain(
        `solidjobs-${skillOffer.jobOfferKey}`,
      );
    });

    it('returns empty for a non-matching term', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });
      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        searchTerm: 'zzz-no-such-term-zzz',
      } as ScraperInputDto);
      expect(result.jobs).toHaveLength(0);
    });
  });

  describe('resultsWanted cap', () => {
    it('honours resultsWanted=1 against a 3-offer page', async () => {
      mockGet.mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });
      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        resultsWanted: 1,
      } as ScraperInputDto);
      expect(result.jobs).toHaveLength(1);
    });
  });

  describe('SOLIDJOBS_DIVISIONS override', () => {
    it('fans out one request per configured division and concatenates results', async () => {
      process.env.SOLIDJOBS_DIVISIONS = 'it, engineering';
      mockGet.mockResolvedValue({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
        resultsWanted: 100,
      } as ScraperInputDto);

      const calledUrls = mockGet.mock.calls.map((c) => c[0] as string);
      expect(calledUrls).toEqual([
        'https://solid.jobs/public-api/offers/it?campaign=api',
        'https://solid.jobs/public-api/offers/engineering?campaign=api',
      ]);
      expect(result.jobs).toHaveLength(6);
    });

    it('keeps the batch alive when one division request fails', async () => {
      process.env.SOLIDJOBS_DIVISIONS = 'it,engineering';
      mockGet
        .mockRejectedValueOnce(new Error('Request failed with status 500'))
        .mockResolvedValueOnce({ data: clone(JOBS_PAGE_RAW) });

      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);

      expect(result.jobs).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('returns empty when the response payload has no jobs', async () => {
      mockGet.mockResolvedValueOnce({ data: { jobs: [] } });
      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);
      expect(result.jobs).toEqual([]);
    });

    it('returns empty for an invalid payload shape', async () => {
      mockGet.mockResolvedValueOnce({ data: { unexpected: true } });
      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);
      expect(result.jobs).toEqual([]);
    });

    it('catches an HTTP failure → empty JobResponseDto, never throws', async () => {
      mockGet.mockRejectedValueOnce(new Error('Request failed with status 500'));
      const service = new SolidJobsService();
      const result = await service.scrape({
        siteType: [Site.SOLIDJOBS],
      } as ScraperInputDto);
      expect(result.jobs).toEqual([]);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('skips a malformed offer (missing title) with a Logger.warn while mapping siblings', async () => {
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      try {
        const page = clone(JOBS_PAGE_RAW) as any;
        page.jobs[0].title = '';
        mockGet.mockResolvedValueOnce({ data: page });

        const service = new SolidJobsService();
        const result = await service.scrape({
          siteType: [Site.SOLIDJOBS],
        } as ScraperInputDto);

        expect(result.jobs).toHaveLength(2);
        expect(result.jobs.map((j) => j.id)).not.toContain(
          `solidjobs-${JOBS_PAGE_RAW.jobs[0].jobOfferKey}`,
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(JOBS_PAGE_RAW.jobs[0].jobOfferKey),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });
  });
});
