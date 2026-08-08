#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
/**
 * Spec 006 / T12 — `JoinComService` performance bench.
 *
 * Establishes a baseline against NFR-2 (`scrape()` p95 < 4 s) on the
 * existing fixture corpus (HTML company page + 2-page JSON jobs corpus
 * with `totalPages=2`, so the bench exercises the full Step-1 + Step-2
 * + paginated-Step-2 round-trip).
 * Emits a single JSON record at `dist/bench/source-ats-joincom.json`.
 *
 * Run standalone (no jest):
 *   npx ts-node -r tsconfig-paths/register \
 *     packages/plugins/source-ats-joincom/__tests__/joincom.bench.ts
 *
 * NB: This file is intentionally NOT picked up by `jest` (its name does
 * not match `*.spec.ts` or `*.e2e-spec.ts`). CI gating against the
 * ceiling is deferred — see Spec 006 / T12 acceptance text.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const COMPANY_HTML = fs.readFileSync(
  path.join(FIXTURE_DIR, 'joincom-company-page.html'),
  'utf8',
);
const JOBS_PAGE_1 = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'joincom-jobs-page-1.json'), 'utf8'),
);
const JOBS_PAGE_2 = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'joincom-jobs-page-2.json'), 'utf8'),
);
const JOBS_PAGE_EMPTY = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'joincom-jobs-page-empty.json'), 'utf8'),
);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// Patch `createHttpClient` BEFORE requiring the service. The barrel
// re-exports through non-configurable getters; we mutate the deepest
// module's writable `exports.createHttpClient` so the barrel's getter
// resolves to the patched function lazily on each access.
//
// Join.com's scraper calls `client.get(...)` for both the Step-1 HTML
// probe and every Step-2 JSON page — we route by URL substring.
const httpClientModule = require('../../../common/src/http/http-client');
httpClientModule.createHttpClient = () => ({
  setHeaders: (_headers: Record<string, string>) => {
    void _headers;
  },
  get: async <T>(url: string): Promise<{ data: T }> => {
    if (url.includes('/api/public/companies/')) {
      // Step 2: JSON jobs page. Route by `page=` query string.
      if (/[?&]page=2(?:&|$)/.test(url)) {
        return { data: clone(JOBS_PAGE_2) as unknown as T };
      }
      if (/[?&]page=1(?:&|$)/.test(url)) {
        return { data: clone(JOBS_PAGE_1) as unknown as T };
      }
      return { data: clone(JOBS_PAGE_EMPTY) as unknown as T };
    }
    // Step 1: HTML company page.
    return { data: COMPANY_HTML as unknown as T };
  },
});

const { Logger } = require('@nestjs/common');
Logger.overrideLogger(false);

const { JoinComService } = require('../src');
const { Site } = require('@ever-jobs/models');

const ITERATIONS = 20;
const WARMUPS = 3;
const NFR2_CEILING_MS = 4000;
const PLUGIN_ID = 'source-ats-joincom';
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'dist', 'bench');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${PLUGIN_ID}.json`);

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

async function main(): Promise<void> {
  const service = new JoinComService();
  const input = {
    siteType: [Site.JOIN_COM],
    companySlug: 'acme-corp',
    resultsWanted: 100,
  };

  for (let i = 0; i < WARMUPS; i++) {
    await service.scrape(input);
  }

  if (typeof global.gc === 'function') global.gc();
  const memBefore = process.memoryUsage().heapUsed;

  const timings: number[] = [];
  let lastRowCount = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = process.hrtime.bigint();
    const result = await service.scrape(input);
    const t1 = process.hrtime.bigint();
    timings.push(Number(t1 - t0) / 1_000_000);
    lastRowCount = result.jobs.length;
  }

  if (typeof global.gc === 'function') global.gc();
  const memAfter = process.memoryUsage().heapUsed;

  const sorted = [...timings].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = timings.reduce((s, x) => s + x, 0) / timings.length;
  const median = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);

  const record = {
    plugin: PLUGIN_ID,
    spec: '006',
    task: 'T12',
    timestamp: new Date().toISOString(),
    iterations: ITERATIONS,
    warmups: WARMUPS,
    fixture: {
      companyHtmlBytes: COMPANY_HTML.length,
      page1Items: JOBS_PAGE_1.items?.length ?? 0,
      page2Items: JOBS_PAGE_2.items?.length ?? 0,
      totalPages: JOBS_PAGE_1.pagination?.totalPages ?? 0,
      rowsPerScrape: lastRowCount,
    },
    timings_ms: {
      min: Number(min.toFixed(3)),
      median: Number(median.toFixed(3)),
      mean: Number(mean.toFixed(3)),
      p95: Number(p95.toFixed(3)),
      p99: Number(p99.toFixed(3)),
      max: Number(max.toFixed(3)),
    },
    memory_bytes: {
      before: memBefore,
      after: memAfter,
      delta: memAfter - memBefore,
    },
    nfr2_ceiling_ms: NFR2_CEILING_MS,
    p95_under_ceiling: p95 < NFR2_CEILING_MS,
    headroom_pct: Number((((NFR2_CEILING_MS - p95) / NFR2_CEILING_MS) * 100).toFixed(2)),
    node_version: process.version,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(record, null, 2) + '\n', 'utf8');

  console.log(
    `[bench] ${PLUGIN_ID}: p95=${record.timings_ms.p95}ms ` +
      `(ceiling ${NFR2_CEILING_MS}ms, headroom ${record.headroom_pct}%) ` +
      `→ ${OUTPUT_FILE}`,
  );
}

main().catch((err) => {
  console.error(`[bench] ${PLUGIN_ID} failed:`, err);
  process.exit(1);
});
