/**
 * Spec 012 / T04 — `extractSalary` micro-benchmark (Jest-discoverable).
 *
 * Establishes a baseline against NFR-1 (`extractSalary` p95 < 0.5 ms
 * on a 200-char input) across all eight supported ISO 4217 currencies
 * (USD / EUR / GBP / CHF / SEK / NOK / DKK / PLN). Cycles a fixed
 * 8-input mix through 1 000 warm-up iterations followed by 5 000
 * measurement iterations; writes a single JSON record at
 * `dist/bench/helpers-salary.json` with overall + per-currency
 * latency stats.
 *
 * **Why a `.spec.ts` extension instead of `.bench.ts`?** Jest's
 * `testMatch` only picks up paths under `__tests__` ending in `.spec.ts` (see
 * [jest.config.js](../../../jest.config.js)). The Spec 012 / T04
 * Notes-for-the-next-run pinned **"Bench is a Jest test, not a
 * standalone script"** — to satisfy that AND keep the file
 * jest-discoverable on CI without a config tweak, the bench lives
 * here under `*.spec.ts` (with the `bench.spec.ts` infix making the
 * dual nature obvious in `git ls-files`). The shape of the bench
 * loop mirrors the three Spec 006 / T12 plugin benches under
 * `packages/plugins/source-ats-<plugin>/__tests__/<plugin>.bench.ts` (same
 * `process.hrtime.bigint()` measurement pattern; same
 * `dist/bench/<name>.json` output convention).
 *
 * The Jest assertion is intentionally loose:
 *   - **CI assert:** `p95 < CI_CEILING_MS` (NFR-1 + 4× headroom for
 *     CI cold-start / GitHub-runner noise — measured budget is
 *     ≤ 0.5 ms; CI ceiling is 2.0 ms).
 *   - **Bench record:** absolute p50 / p95 / p99 / mean for trend
 *     analysis; NFR-1 absolute headroom is reported but not asserted
 *     against (avoids cold-start flakes per Notes-for-the-next-run
 *     decision 2).
 */
import { extractSalary } from '@ever-jobs/common';
import { Country } from '@ever-jobs/models';
import * as fs from 'fs';
import * as path from 'path';

// === Fixture inputs — one 200-char input per supported currency. ===========
//
// Each input begins with realistic surrounding ad copy and embeds the
// salary range near the middle, mirroring typical real-world job-board
// text density (the salary line is rarely the whole input). Lengths are
// validated below to guard against drift; CI fails the bench if any
// fixture deviates from 200 chars (cheap regression pin).

const PREAMBLE =
  'We are looking for an experienced full-stack developer to join our growing team. Strong remote-first culture, generous PTO, learning budget. Salary band: ';
const TAIL = ' negotiable depending on experience.';

interface BenchFixture {
  readonly currency: string;
  readonly input: string;
  readonly options: { country?: Country };
  readonly expectedMin: number;
  readonly expectedMax: number;
}

function pad200(prefix: string, salaryFragment: string, suffix: string): string {
  const base = prefix + salaryFragment + suffix;
  if (base.length === 200) return base;
  if (base.length < 200) {
    return base + ' '.repeat(200 - base.length);
  }
  // Trim from the suffix end to land at exactly 200.
  return base.slice(0, 200);
}

const NBSP = ' ';

const FIXTURES: ReadonlyArray<BenchFixture> = [
  {
    currency: 'USD',
    input: pad200(PREAMBLE, '$100,000 - $150,000', TAIL),
    options: {},
    expectedMin: 100000,
    expectedMax: 150000,
  },
  {
    currency: 'EUR',
    input: pad200(PREAMBLE, '45.000 € – 60.000 €', TAIL),
    options: { country: Country.GERMANY },
    expectedMin: 45000,
    expectedMax: 60000,
  },
  {
    currency: 'GBP',
    input: pad200(PREAMBLE, '£40,000 – £55,000', TAIL),
    options: {},
    expectedMin: 40000,
    expectedMax: 55000,
  },
  {
    currency: 'CHF',
    input: pad200(PREAMBLE, 'CHF 90,000 – CHF 120,000', TAIL),
    options: {},
    expectedMin: 90000,
    expectedMax: 120000,
  },
  {
    currency: 'SEK',
    input: pad200(PREAMBLE, `450${NBSP}000 kr – 600${NBSP}000 kr`, TAIL),
    options: { country: Country.SWEDEN },
    expectedMin: 450000,
    expectedMax: 600000,
  },
  {
    currency: 'NOK',
    input: pad200(PREAMBLE, 'NOK 500000 - NOK 700000', TAIL),
    options: {},
    expectedMin: 500000,
    expectedMax: 700000,
  },
  {
    currency: 'DKK',
    input: pad200(PREAMBLE, '25.000 kr - 28.000 kr', TAIL),
    options: { country: Country.DENMARK },
    expectedMin: 25000,
    expectedMax: 28000,
  },
  {
    currency: 'PLN',
    input: pad200(PREAMBLE, '8.000 zł – 12.000 zł', TAIL),
    options: {},
    expectedMin: 8000,
    expectedMax: 12000,
  },
];

const WARMUPS = 1000;
const ITERATIONS = 5000;
const NFR1_TARGET_MS = 0.5;
// 4× headroom over NFR-1 keeps CI honest without flaking on
// GitHub-runner cold starts or bursty noise. Local devs typically
// see p95 ≈ 0.05–0.10 ms on a warm process.
const CI_CEILING_MS = 2.0;
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', '..', 'dist', 'bench');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'helpers-salary.json');

function percentile(sorted: ReadonlyArray<number>, p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

function summarise(timings: ReadonlyArray<number>): {
  readonly min: number;
  readonly median: number;
  readonly mean: number;
  readonly p95: number;
  readonly p99: number;
  readonly max: number;
  readonly runs: number;
} {
  const sorted = [...timings].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = timings.reduce((s, x) => s + x, 0) / timings.length;
  const median = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  return {
    min: Number(min.toFixed(4)),
    median: Number(median.toFixed(4)),
    mean: Number(mean.toFixed(4)),
    p95: Number(p95.toFixed(4)),
    p99: Number(p99.toFixed(4)),
    max: Number(max.toFixed(4)),
    runs: timings.length,
  };
}

describe('extractSalary — Spec 012 / T04 bench (NFR-1)', () => {
  it('all 8 fixtures parse correctly before measurement starts', () => {
    // Pre-flight pin: if any fixture stops returning the expected
    // numeric pair, the bench numbers are meaningless. Run all 8
    // through `extractSalary` once and assert the contract holds.
    for (const fx of FIXTURES) {
      expect(fx.input.length).toBe(200);
      const out = extractSalary(fx.input, fx.options);
      expect(out.currency).toBe(fx.currency);
      expect(out.minAmount).toBe(fx.expectedMin);
      expect(out.maxAmount).toBe(fx.expectedMax);
    }
  });

  it(`p95 < ${CI_CEILING_MS} ms across 5 000 iterations x 8 currencies`, () => {
    // === Warm-up — discount JIT / V8 inline-cache / regex compile costs.
    for (let i = 0; i < WARMUPS; i++) {
      const fx = FIXTURES[i % FIXTURES.length];
      extractSalary(fx.input, fx.options);
    }

    // === Measurement — `process.hrtime.bigint()` for sub-ms precision.
    const allTimings: number[] = [];
    const perCurrencyTimings = new Map<string, number[]>(
      FIXTURES.map((fx) => [fx.currency, []]),
    );

    for (let i = 0; i < ITERATIONS; i++) {
      const fx = FIXTURES[i % FIXTURES.length];
      const t0 = process.hrtime.bigint();
      extractSalary(fx.input, fx.options);
      const t1 = process.hrtime.bigint();
      const ms = Number(t1 - t0) / 1_000_000;
      allTimings.push(ms);
      perCurrencyTimings.get(fx.currency)!.push(ms);
    }

    const overall = summarise(allTimings);
    const perCurrency: Record<string, ReturnType<typeof summarise>> = {};
    for (const [currency, timings] of perCurrencyTimings.entries()) {
      perCurrency[currency] = summarise(timings);
    }

    const record = {
      spec: '012',
      task: 'T04',
      timestamp: new Date().toISOString(),
      iterations: ITERATIONS,
      warmups: WARMUPS,
      input_chars: 200,
      nfr1_target_ms: NFR1_TARGET_MS,
      ci_ceiling_ms: CI_CEILING_MS,
      overall,
      perCurrency,
      p95_under_nfr1: overall.p95 < NFR1_TARGET_MS,
      p95_under_ci_ceiling: overall.p95 < CI_CEILING_MS,
      headroom_pct: Number(
        (((CI_CEILING_MS - overall.p95) / CI_CEILING_MS) * 100).toFixed(2),
      ),
      node_version: process.version,
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(record, null, 2) + '\n',
      'utf8',
    );

    // CI assertion — loose; absolute NFR-1 status reported in record.
    expect(overall.p95).toBeLessThan(CI_CEILING_MS);
  });
});
