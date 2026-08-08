#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
/**
 * Spec 013 / T14 — `TeslaService` performance bench.
 *
 * Establishes a baseline against NFR-2 (`scrape()` p95 < 12 s) on the
 * existing fixture corpus (`tesla-board.json` — 50-listing board
 * envelope + four detail envelopes covering the full / partial /
 * single-field / missing-all-four variants of the per-job detail
 * shape). Default `descriptionDepth` is `'detail-25'` so the bench
 * exercises a 1 board + 25 detail-fetch fan-out — the canonical
 * happy-path NFR-2 cited in tasks.md ("HTTP-only, ≤ 25 detail
 * fetches"). Emits a single JSON record at
 * `dist/bench/source-tesla.json`.
 *
 * Run standalone (no jest):
 *   npx ts-node -r tsconfig-paths/register \
 *     packages/plugins/source-tesla/__tests__/tesla.bench.ts
 *
 * NB: This file is intentionally NOT picked up by `jest` (its name does
 * not match `*.spec.ts` or `*.e2e-spec.ts`). CI gating against the
 * ceiling is deferred — see Spec 013 / T14 acceptance text and the
 * "follow-up" note in Phase 6.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const BOARD_RAW = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'tesla-board.json'), 'utf8'),
);
const DETAIL_200001 = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'tesla-job-200001.json'), 'utf8'),
);
const DETAIL_200002 = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'tesla-job-200002.json'), 'utf8'),
);
const DETAIL_200003 = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'tesla-job-200003.json'), 'utf8'),
);
const DETAIL_MISSING = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_DIR, 'tesla-job-missing.json'), 'utf8'),
);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// Patch `createHttpClient` BEFORE requiring the service. The barrel
// re-exports through non-configurable getters; we mutate the deepest
// module's writable `exports.createHttpClient` so the barrel's getter
// resolves to the patched function lazily on each access.
//
// Tesla issues 1 board GET + N detail GETs per scrape (N capped by
// `descriptionDepth` budget — default `'detail-25'` ⇒ 25). We route
// by URL substring: `/cua-api/apps/careers/state` → board fixture;
// `/cua-api/careers/job/<id>` → matching detail fixture (200001 /
// 200002 / 200003) with `tesla-job-missing.json` as the fallback for
// every other listing ID. Same router shape used by the integration
// + e2e tiers (Spec 013 / T11 / T12) so a future contributor can
// `git diff` the three test runners and convince themselves the
// bench is honestly measuring the real wire shape.
const DETAIL_BY_ID: Record<string, unknown> = {
  '200001': DETAIL_200001,
  '200002': DETAIL_200002,
  '200003': DETAIL_200003,
};

const httpClientModule = require('../../../common/src/http/http-client');
httpClientModule.createHttpClient = () => ({
  setHeaders: (_headers: Record<string, string>) => {
    void _headers;
  },
  get: async <T>(url: string): Promise<{ data: T }> => {
    if (url.includes('/cua-api/apps/careers/state')) {
      return { data: clone(BOARD_RAW) as unknown as T };
    }
    const match = /\/cua-api\/careers\/job\/([^/?]+)/.exec(url);
    if (match) {
      const detail = DETAIL_BY_ID[match[1]] ?? DETAIL_MISSING;
      return { data: clone(detail) as unknown as T };
    }
    return { data: clone(DETAIL_MISSING) as unknown as T };
  },
});

const { Logger } = require('@nestjs/common');
Logger.overrideLogger(false);

const { TeslaService } = require('../src');
const { Site } = require('@ever-jobs/models');

const ITERATIONS = 20;
const WARMUPS = 3;
const NFR2_CEILING_MS = 12000;
const PLUGIN_ID = 'source-tesla';
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
  const service = new TeslaService();
  // `descriptionDepth: 'detail-25'` is the default; the bench pins it
  // explicitly so the 1 board + 25 detail-fetch fan-out is documented
  // in the emitted JSON record. `resultsWanted: 100` lets the full
  // 50-row board flow through the mapping pass (the detail-fetch
  // budget caps the follow-up GETs at 25 regardless).
  const input = {
    siteType: [Site.TESLA],
    descriptionDepth: 'detail-25' as const,
    resultsWanted: 100,
  };

  for (let i = 0; i < WARMUPS; i++) {
    await service.scrape(input);
  }

  if (typeof global.gc === 'function') global.gc();
  const memBefore = process.memoryUsage().heapUsed;

  const timings: number[] = [];
  let lastRowCount = 0;
  let lastDescribed = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = process.hrtime.bigint();
    const result = await service.scrape(input);
    const t1 = process.hrtime.bigint();
    timings.push(Number(t1 - t0) / 1_000_000);
    lastRowCount = result.jobs.length;
    lastDescribed = result.jobs.filter(
      (j: { description: string | null }) => j.description !== null,
    ).length;
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

  const boardListings = Array.isArray(BOARD_RAW?.listings)
    ? BOARD_RAW.listings.length
    : 0;

  const record = {
    plugin: PLUGIN_ID,
    spec: '013',
    task: 'T14',
    timestamp: new Date().toISOString(),
    iterations: ITERATIONS,
    warmups: WARMUPS,
    fixture: {
      boardListings,
      detailFixtureIds: Object.keys(DETAIL_BY_ID).length,
      descriptionDepth: 'detail-25',
      detailBudget: 25,
      rowsPerScrape: lastRowCount,
      describedPerScrape: lastDescribed,
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
