#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
/**
 * Spec 006 / T12 — `GemService` performance bench.
 *
 * Establishes a baseline against NFR-2 (`scrape()` p95 < 1.5 s) on the
 * existing fixture corpus (`gem-batch-response.json`, the canonical
 * 3-posting batch envelope). Emits a single JSON record at
 * `dist/bench/source-ats-gem.json`.
 *
 * Run standalone (no jest):
 *   npx ts-node -r tsconfig-paths/register \
 *     packages/plugins/source-ats-gem/__tests__/gem.bench.ts
 *
 * NB: This file is intentionally NOT picked up by `jest` (its name does
 * not match `*.spec.ts` or `*.e2e-spec.ts`). CI gating against the
 * ceiling is deferred — see Spec 006 / T12 acceptance text.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const BATCH_RESPONSE_RAW = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'gem-batch-response.json'), 'utf8'),
) as unknown[];

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// Patch `createHttpClient` BEFORE requiring the service. The barrel
// re-exports through non-configurable getters; we mutate the deepest
// module's writable `exports.createHttpClient` so the barrel's getter
// resolves to the patched function lazily on each access.
//
// Gem issues exactly ONE batched POST per scrape; the factory returns
// a fresh stub client each call — and since the fixture is deep-cloned
// per invocation, multiple scrapes don't pollute one another.
const httpClientModule = require('../../../common/src/http/http-client');
httpClientModule.createHttpClient = () => ({
  setHeaders: (_headers: Record<string, string>) => {
    void _headers;
  },
  post: async <T>(_url: string, _body: unknown): Promise<{ data: T }> => {
    void _url;
    void _body;
    return { data: clone(BATCH_RESPONSE_RAW) as unknown as T };
  },
});

const { Logger } = require('@nestjs/common');
Logger.overrideLogger(false);

const { GemService } = require('../src');
const { Site } = require('@ever-jobs/models');

const ITERATIONS = 20;
const WARMUPS = 3;
const NFR2_CEILING_MS = 1500;
const PLUGIN_ID = 'source-ats-gem';
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
  const service = new GemService();
  const input = {
    siteType: [Site.GEM],
    companySlug: 'acme',
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
      batchResponseEnvelopes: Array.isArray(BATCH_RESPONSE_RAW)
        ? BATCH_RESPONSE_RAW.length
        : 0,
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
