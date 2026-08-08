import { JobPostDto, LocationDto, Site } from '@ever-jobs/models';
import { DedupHybridService } from '../src/dedup-hybrid.service';

/**
 * Spec 003 / T10 — performance benchmark suite.
 *
 * Asserts the two non-functional requirements declared in the spec:
 *  - **NFR-1**: 1 000 jobs dedup in < 250 ms p95.
 *  - **NFR-2**: 10 000 jobs dedup in < 2.5 s p95.
 *
 * The suite uses a 5x duplication factor so both pipeline stages do real
 * work (Stage 1 hash bucketing collapses cosmetic duplicates; Stage 2
 * MinHash sees the resulting variants). Latency is measured across N runs
 * and the maximum observed elapsed-ms is asserted to be under budget.
 *
 * The default budgets are deliberately conservative — CI workers can be
 * slower than local laptops. We measure the *max* across runs (a pessimistic
 * approximation of p95 with small N) so regressions stand out.
 */

const RUN_COUNT = Number(process.env.DEDUP_PERF_RUNS ?? 5);
const NFR1_BUDGET_MS = Number(process.env.DEDUP_PERF_NFR1_MS ?? 250);
const NFR2_BUDGET_MS = Number(process.env.DEDUP_PERF_NFR2_MS ?? 2500);

const LONG_DESC =
  'We are hiring a Senior Software Engineer to join our backend platform team. ' +
  'You will design, build, and operate distributed systems running on Kubernetes. ' +
  'The ideal candidate has strong experience with TypeScript, NestJS, and PostgreSQL. ' +
  'We offer competitive salary, equity, and a remote-friendly work environment.';

function buildBatch(size: number, distinct: number): JobPostDto[] {
  const out: JobPostDto[] = [];
  for (let i = 0; i < size; i++) {
    const k = i % distinct;
    out.push(
      new JobPostDto({
        id: String(i),
        title: `Engineer ${k}`,
        companyName: `Company ${k}`,
        jobUrl: `https://e.test/${i}`,
        site: i % 2 === 0 ? Site.GREENHOUSE : Site.LINKEDIN,
        description: `${LONG_DESC} variant ${k}`,
        location: new LocationDto({ city: 'Remote', state: '', country: 'USA' }),
      }),
    );
  }
  return out;
}

async function measure(service: DedupHybridService, batch: JobPostDto[]): Promise<number> {
  const start = Date.now();
  const out = await service.dedup(batch);
  const elapsed = Date.now() - start;
  // Sanity assertions to make sure dedup actually ran.
  if (out.metrics.inputCount !== batch.length) {
    throw new Error(`unexpected inputCount ${out.metrics.inputCount}`);
  }
  if (out.metrics.outputCount === 0) {
    throw new Error('outputCount must be > 0');
  }
  return elapsed;
}

describe('DedupHybridService — performance gates (Spec 003 NFR-1/NFR-2)', () => {
  let service: DedupHybridService;

  beforeEach(() => {
    service = new DedupHybridService();
  });

  it(`NFR-1: 1 000 jobs in under ${NFR1_BUDGET_MS} ms (max over ${RUN_COUNT} runs)`, async () => {
    const batch = buildBatch(1000, 200);
    const samples: number[] = [];
    for (let i = 0; i < RUN_COUNT; i++) {
      samples.push(await measure(service, batch));
    }
    const worst = Math.max(...samples);
    expect(worst).toBeLessThan(NFR1_BUDGET_MS);
  }, 30_000);

  it(`NFR-2: 10 000 jobs in under ${NFR2_BUDGET_MS} ms (max over ${RUN_COUNT} runs)`, async () => {
    const batch = buildBatch(10_000, 1_000);
    const samples: number[] = [];
    for (let i = 0; i < RUN_COUNT; i++) {
      samples.push(await measure(service, batch));
    }
    const worst = Math.max(...samples);
    expect(worst).toBeLessThan(NFR2_BUDGET_MS);
  }, 60_000);
});
