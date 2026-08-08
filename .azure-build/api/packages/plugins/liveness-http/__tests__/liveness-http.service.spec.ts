import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import {
  ILivenessChecker,
  LIVENESS_CHECKER_TOKEN,
  LivenessVerdict,
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

import { createHttpClient } from '@ever-jobs/common';
import { LivenessHttpModule, LivenessHttpService } from '../src';
import {
  DEFAULT_TIMEOUT_MS,
  LIVENESS_ACCEPT_HEADER,
  LIVENESS_USER_AGENT,
} from '../src/liveness-http.constants';

/**
 * Spec 721 / T07 — `LivenessHttpService` unit tests with a mocked HTTP
 * client.
 */

const ACTIVE_HTML =
  '<html><head><title>Senior Engineer</title></head><body>' +
  '<p>We are a distributed engineering organisation building data pipelines ' +
  'for the renewable energy sector. The role involves designing resilient ' +
  'ingestion services, reviewing pull requests, mentoring junior colleagues, ' +
  'and collaborating with product managers on quarterly roadmaps.</p>' +
  '<p>Benefits include flexible hours, a generous learning budget, and an ' +
  'annual team offsite spanning TypeScript and PostgreSQL workloads.</p>' +
  '<a href="/application">Apply Now</a>' +
  '</body></html>';

function httpResponse(status: number, data: string, finalUrl?: string) {
  return {
    status,
    data,
    headers: {},
    request: finalUrl ? { res: { responseUrl: finalUrl } } : {},
  };
}

function expectIsoTimestamp(verdict: LivenessVerdict): void {
  expect(new Date(verdict.checkedAt).toISOString()).toBe(verdict.checkedAt);
}

describe('LivenessHttpService — Spec 721 / T07', () => {
  let service: LivenessHttpService;

  beforeEach(() => {
    mockGet.mockReset();
    (createHttpClient as jest.Mock).mockClear();
    service = new LivenessHttpService();
  });

  describe('DI scaffolding (FR-15)', () => {
    it('binds the service under LIVENESS_CHECKER_TOKEN via useExisting', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [LivenessHttpModule],
      }).compile();

      const byToken = moduleRef.get<ILivenessChecker>(LIVENESS_CHECKER_TOKEN);
      const byClass = moduleRef.get(LivenessHttpService);
      expect(byToken).toBeInstanceOf(LivenessHttpService);
      expect(byToken).toBe(byClass);
      await moduleRef.close();
    });
  });

  describe('check() — status classification', () => {
    it('404 -> expired/http_gone (FR-1)', async () => {
      mockGet.mockResolvedValueOnce(httpResponse(404, '<html>not found</html>'));
      const v = await service.check('https://board.example.com/jobs/1');
      expect(v.url).toBe('https://board.example.com/jobs/1');
      expect(v.result).toBe('expired');
      expect(v.code).toBe('http_gone');
      expect(v.httpStatus).toBe(404);
      expectIsoTimestamp(v);
    });

    it('410 -> expired/http_gone (FR-1)', async () => {
      mockGet.mockResolvedValueOnce(httpResponse(410, ''));
      const v = await service.check('https://board.example.com/jobs/2');
      expect(v).toMatchObject({ result: 'expired', code: 'http_gone', httpStatus: 410 });
    });

    it('403 -> uncertain/access_blocked — never expired (FR-2 / NFR-5)', async () => {
      mockGet.mockResolvedValueOnce(httpResponse(403, '<html>forbidden</html>'));
      const v = await service.check('https://board.example.com/jobs/3');
      expect(v).toMatchObject({ result: 'uncertain', code: 'access_blocked', httpStatus: 403 });
      expect(v.result).not.toBe('expired');
    });

    it('503 -> uncertain/access_blocked (FR-2)', async () => {
      mockGet.mockResolvedValueOnce(httpResponse(503, ''));
      const v = await service.check('https://board.example.com/jobs/4');
      expect(v).toMatchObject({ result: 'uncertain', code: 'access_blocked', httpStatus: 503 });
    });

    it('500 -> uncertain/http_error (FR-3)', async () => {
      mockGet.mockResolvedValueOnce(httpResponse(500, ''));
      const v = await service.check('https://board.example.com/jobs/5');
      expect(v).toMatchObject({ result: 'uncertain', code: 'http_error', httpStatus: 500 });
    });
  });

  describe('check() — transport failures (FR-4)', () => {
    it('network error -> uncertain/fetch_failed, never throws', async () => {
      mockGet.mockRejectedValueOnce(new Error('connect ETIMEDOUT 203.0.113.7:443'));
      const v = await service.check('https://slow.example.com/jobs/9');
      expect(v).toMatchObject({ result: 'uncertain', code: 'fetch_failed' });
      expect(v.httpStatus).toBeUndefined();
      expectIsoTimestamp(v);
    });

    it('thrown axios-style error carrying response.status is still classified (D-04 fallback)', async () => {
      mockGet.mockRejectedValueOnce(
        Object.assign(new Error('Request failed with status code 404'), {
          response: { status: 404 },
        }),
      );
      const v = await service.check('https://board.example.com/jobs/10');
      expect(v).toMatchObject({ result: 'expired', code: 'http_gone', httpStatus: 404 });
    });
  });

  describe('check() — happy active page', () => {
    it('200 + apply control -> active/apply_control_visible with transport defaults', async () => {
      mockGet.mockResolvedValueOnce(httpResponse(200, ACTIVE_HTML));
      const v = await service.check('https://board.example.com/jobs/11');

      expect(v).toMatchObject({
        url: 'https://board.example.com/jobs/11',
        result: 'active',
        code: 'apply_control_visible',
        httpStatus: 200,
      });
      expectIsoTimestamp(v);

      // Transport contract: Accept header, ms timeout, non-throwing statuses.
      const [calledUrl, config] = mockGet.mock.calls[0];
      expect(calledUrl).toBe('https://board.example.com/jobs/11');
      expect(config.headers.Accept).toBe(LIVENESS_ACCEPT_HEADER);
      expect(config.timeout).toBe(DEFAULT_TIMEOUT_MS);
      expect(config.validateStatus()).toBe(true);

      // Client built with the desktop Chrome UA and no retries.
      expect(createHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({ userAgent: LIVENESS_USER_AGENT, retries: 0 }),
      );
    });

    it('honours a custom timeoutMs', async () => {
      mockGet.mockResolvedValueOnce(httpResponse(200, ACTIVE_HTML));
      await service.check('https://board.example.com/jobs/12', { timeoutMs: 4000 });
      expect(mockGet.mock.calls[0][1].timeout).toBe(4000);
    });
  });

  describe('check() — body and URL heuristics through the service', () => {
    it('error=true redirect -> expired/expired_url even when the body looks active (FR-5)', async () => {
      mockGet.mockResolvedValueOnce(
        httpResponse(200, ACTIVE_HTML, 'https://board.example.com/careers?error=true'),
      );
      const v = await service.check('https://board.example.com/jobs/13');
      expect(v).toMatchObject({ result: 'expired', code: 'expired_url', httpStatus: 200 });
    });

    it('tombstone body -> expired/expired_text (FR-7)', async () => {
      mockGet.mockResolvedValueOnce(
        httpResponse(200, '<html><body><p>This job is no longer available.</p></body></html>'),
      );
      const v = await service.check('https://board.example.com/jobs/14');
      expect(v).toMatchObject({ result: 'expired', code: 'expired_text', httpStatus: 200 });
    });
  });

  describe('checkBatch() (FR-13 / FR-14)', () => {
    it('returns one verdict per URL, in input order, with mixed outcomes incl. a rejection', async () => {
      mockGet.mockImplementation((url: string) => {
        if (url.includes('gone')) return Promise.resolve(httpResponse(404, ''));
        if (url.includes('netfail')) return Promise.reject(new Error('socket hang up'));
        return Promise.resolve(httpResponse(200, ACTIVE_HTML));
      });

      const urls = [
        'https://a.example.com/jobs/1-gone',
        'https://b.example.com/jobs/2',
        'https://c.example.com/jobs/3-netfail',
        'https://d.example.com/jobs/4',
      ];
      const out = await service.checkBatch(urls);

      expect(out).toHaveLength(4);
      expect(out.map((v) => v.url)).toEqual(urls); // input order preserved
      expect(out[0]).toMatchObject({ result: 'expired', code: 'http_gone' });
      expect(out[1]).toMatchObject({ result: 'active', code: 'apply_control_visible' });
      expect(out[2]).toMatchObject({ result: 'uncertain', code: 'fetch_failed' });
      expect(out[3]).toMatchObject({ result: 'active', code: 'apply_control_visible' });
      out.forEach(expectIsoTimestamp);

      // One shared client per batch (D-05).
      expect(createHttpClient).toHaveBeenCalledTimes(1);
    });

    it('bounds concurrency to the requested worker count', async () => {
      let inFlight = 0;
      let maxInFlight = 0;
      mockGet.mockImplementation(async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 10));
        inFlight -= 1;
        return httpResponse(200, ACTIVE_HTML);
      });

      const urls = Array.from({ length: 6 }, (_, i) => `https://x.example.com/jobs/${i}`);
      const out = await service.checkBatch(urls, { concurrency: 2 });

      expect(out).toHaveLength(6);
      expect(out.map((v) => v.url)).toEqual(urls);
      expect(maxInFlight).toBeLessThanOrEqual(2);
      expect(mockGet).toHaveBeenCalledTimes(6);
    });

    it('returns an empty array for an empty batch without touching the network', async () => {
      const out = await service.checkBatch([]);
      expect(out).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });
});
