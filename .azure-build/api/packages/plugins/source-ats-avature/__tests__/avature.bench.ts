#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
/**
 * Spec 006 / T12 — `AvatureService` performance bench.
 *
 * Establishes a baseline against NFR-2 (`scrape()` p95 < 8 s) on the
 * existing fixture corpus (`avature-page-1.html` + `avature-page-empty.html`).
 * Emits a single JSON record at `dist/bench/source-ats-avature.json`.
 *
 * Run standalone (no jest):
 *   npx ts-node -r tsconfig-paths/register \
 *     packages/plugins/source-ats-avature/__tests__/avature.bench.ts
 *
 * NB: This file is intentionally NOT picked up by `jest` (its name does
 * not match `*.spec.ts` or `*.e2e-spec.ts`). CI gating against the
 * ceiling is deferred — see Spec 006 / T12 acceptance text and the
 * "follow-up" note in Phase 5.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const PAGE_1_HTML = fs.readFileSync(
  path.join(FIXTURE_DIR, 'avature-page-1.html'),
  'utf8',
);
const PAGE_EMPTY_HTML = fs.readFileSync(
  path.join(FIXTURE_DIR, 'avature-page-empty.html'),
  'utf8',
);

// Patch `createHttpClient` BEFORE requiring the service. The service
// captures `createHttpClient` via the `@ever-jobs/common` barrel, but
// the barrel re-exports through `__exportStar`-generated getters that
// are NOT configurable — so we can't redefine the property on the
// barrel itself. Instead we mutate the deepest module's own writable
// `exports.createHttpClient`; the barrel's getter resolves through it
// lazily on each access, so the patched function flows through.
//
// Each call to the factory yields a fresh client with its own page
// counter — Avature paginates until an empty page is hit, so we feed
// page-1 once then page-empty thereafter.
const httpClientModule = require('../../../common/src/http/http-client');
httpClientModule.createHttpClient = () => {
  let pageIdx = 0;
  return {
    setHeaders: (_headers: Record<string, string>) => {
      void _headers;
    },
    get: async <T>(_url: string): Promise<{ data: T }> => {
      void _url;
      const html = pageIdx === 0 ? PAGE_1_HTML : PAGE_EMPTY_HTML;
      pageIdx++;
      return { data: html as unknown as T };
    },
  };
};

// Silence the NestJS Logger so the bench output isn't polluted.
const { Logger } = require('@nestjs/common');
Logger.overrideLogger(false);

const { AvatureService } = require('../src');
const { Site } = require('@ever-jobs/models');

const ITERATIONS = 20;
const WARMUPS = 3;
const NFR2_CEILING_MS = 8000;
const PLUGIN_ID = 'source-ats-avature';
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
  const service = new AvatureService();
  const input = {
    siteType: [Site.AVATURE],
    companySlug: 'bloomberg',
    resultsWanted: 100,
  };

  // Warm-up — discount JIT / module-init costs.
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
      page1Bytes: PAGE_1_HTML.length,
      pageEmptyBytes: PAGE_EMPTY_HTML.length,
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
