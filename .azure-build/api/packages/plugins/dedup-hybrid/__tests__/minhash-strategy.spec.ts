import { JobPostDto, Site } from '@ever-jobs/models';
import { MinHasher } from '../src/minhash';
import { MinHashStrategy, deriveBands } from '../src/strategies/minhash-strategy';
import { PreparedJob } from '../src/types';

const LONG_DESCRIPTION =
  'We are hiring a Senior Software Engineer to join our backend platform team. ' +
  'You will design, build, and operate distributed systems running on Kubernetes. ' +
  'The ideal candidate has strong experience with TypeScript, NestJS, and PostgreSQL, ' +
  'and brings 5+ years of production-grade engineering experience. ' +
  'We offer competitive salary, equity, and a remote-friendly work environment.';

function prepared(opts: {
  index: number;
  description?: string;
  title?: string;
  companyName?: string;
}): PreparedJob {
  const raw = new JobPostDto({
    title: opts.title ?? 'Senior Software Engineer',
    companyName: opts.companyName ?? 'Acme Corp',
    jobUrl: `https://acme.example.com/jobs/${opts.index}`,
    site: Site.GREENHOUSE,
    description: opts.description ?? null,
  });
  return {
    index: opts.index,
    canonicalKey: `key-${opts.index}`,
    canonicalJobId: `id-${opts.index}`,
    raw,
  };
}

describe('MinHashStrategy', () => {
  it('exposes a stable strategy name', () => {
    expect(new MinHashStrategy().name).toBe('minhash');
  });

  it('rejects invalid signature/band configurations', () => {
    // Also proves an explicit `bands` value wins over derivation — the
    // derivation only ever returns divisors, so the throw can only come from
    // the explicit (100, 7) combination being used as-is.
    expect(() => new MinHashStrategy({ signatureSize: 100, bands: 7 })).toThrow();
  });

  it('derives LSH banding from the similarity threshold (Spec 722 / FR-3, FR-4)', () => {
    // recall(s) = 1-(1-s^R)^B must be >= 0.95 at s = threshold; smallest
    // qualifying divisor wins. Defaults (128, 0.85) must keep the historical
    // B=16 split (back-compat, FR-4).
    expect(deriveBands(128, 0.85)).toBe(16);
    expect(deriveBands(128, 0.6)).toBe(32);
    expect(deriveBands(128, 0.95)).toBe(8);
  });

  it('computes one signature per distinct text and groups identical texts (Spec 722 / FR-5)', () => {
    const spy = jest.spyOn(MinHasher.prototype, 'signature');
    try {
      const out = new MinHashStrategy().cluster([
        prepared({ index: 0, description: LONG_DESCRIPTION }),
        prepared({ index: 1, description: LONG_DESCRIPTION }),
        prepared({ index: 2, description: LONG_DESCRIPTION }),
        prepared({
          index: 3,
          description:
            'Looking for a UX designer fluent in Figma and design-system stewardship. ' +
            'Strong portfolio required, with experience in mobile-first interfaces.',
        }),
      ]);
      // Two distinct texts -> exactly two signature computations.
      expect(spy).toHaveBeenCalledTimes(2);
      expect(out.clusters).toHaveLength(1);
      expect([...out.clusters[0]].sort((a, b) => a - b)).toEqual([0, 1, 2]);
    } finally {
      spy.mockRestore();
    }
  });

  it('emits transitively connected jobs as a single merged component (Spec 722 / FR-6)', () => {
    const tailA = ' Visa sponsorship and relocation included.';
    const tailB = ' Visa sponsorship and relocation included. Apply directly today.';
    const out = new MinHashStrategy().cluster([
      prepared({ index: 0, description: LONG_DESCRIPTION }),
      prepared({ index: 1, description: LONG_DESCRIPTION + tailA }),
      prepared({ index: 2, description: LONG_DESCRIPTION + tailB }),
    ]);
    expect(out.clusters).toHaveLength(1);
    expect([...out.clusters[0]].sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it('returns no clusters for empty input', () => {
    const out = new MinHashStrategy().cluster([]);
    expect(out.clusters).toEqual([]);
  });

  it('returns no clusters when only one job is MinHashable', () => {
    const out = new MinHashStrategy().cluster([
      prepared({ index: 0, description: LONG_DESCRIPTION }),
    ]);
    expect(out.clusters).toEqual([]);
  });

  it('clusters near-duplicate descriptions above the threshold', () => {
    // Append a short tail rather than mutate words inline — keeps Jaccard
    // comfortably above the default 0.85 verification threshold so the test
    // does not flake on the signature estimator's variance.
    const tweaked = LONG_DESCRIPTION + ' Visa sponsorship and relocation included.';
    const out = new MinHashStrategy().cluster([
      prepared({ index: 0, description: LONG_DESCRIPTION }),
      prepared({ index: 1, description: tweaked }),
    ]);
    expect(out.clusters).toHaveLength(1);
    expect([...out.clusters[0]].sort((a, b) => a - b)).toEqual([0, 1]);
  });

  it('respects a configurable similarity threshold', () => {
    // Two heavily perturbed descriptions — Jaccard ≈ 0.7 — should NOT merge
    // at the default threshold but DO merge when threshold is lowered.
    const tweaked =
      LONG_DESCRIPTION.replace(/Senior/g, 'Sr.')
        .replace(/strong/g, 'solid')
        .replace(/years/g, 'yrs')
        .replace(/competitive/g, 'attractive') + ' Health benefits included.';
    const inputs = [
      prepared({ index: 0, description: LONG_DESCRIPTION }),
      prepared({ index: 1, description: tweaked }),
    ];

    const strict = new MinHashStrategy({ similarityThreshold: 0.95 }).cluster(inputs);
    expect(strict.clusters).toEqual([]);

    const lenient = new MinHashStrategy({ similarityThreshold: 0.6 }).cluster(inputs);
    expect(lenient.clusters).toHaveLength(1);
  });

  it('does NOT cluster clearly different descriptions', () => {
    const out = new MinHashStrategy().cluster([
      prepared({ index: 0, description: LONG_DESCRIPTION }),
      prepared({
        index: 1,
        description:
          'Looking for a UX designer fluent in Figma and design-system stewardship. ' +
          'Strong portfolio required, with experience in mobile-first interfaces, ' +
          'cross-functional collaboration, and rapid prototyping.',
      }),
    ]);
    expect(out.clusters).toEqual([]);
  });

  it('skips jobs whose text is below minTextLength', () => {
    const out = new MinHashStrategy({ minTextLength: 80 }).cluster([
      prepared({ index: 0, description: 'Too short.' }),
      prepared({ index: 1, description: 'Also short.' }),
    ]);
    expect(out.clusters).toEqual([]);
  });

  it('falls back to title + company when description is empty', () => {
    const t1 =
      'Principal Software Engineer Backend Platform Team Distributed Systems Cloud Native';
    const t2 =
      'Principal Software Engineer Backend Platform Team Distributed Systems Cloud Native';
    const out = new MinHashStrategy({ minTextLength: 40 }).cluster([
      prepared({ index: 0, title: t1, companyName: 'Acme Corp' }),
      prepared({ index: 1, title: t2, companyName: 'Acme Corp' }),
    ]);
    expect(out.clusters).toHaveLength(1);
  });

  it('produces deterministic output across runs', () => {
    const inputs = [
      prepared({ index: 0, description: LONG_DESCRIPTION }),
      prepared({ index: 1, description: LONG_DESCRIPTION + ' bonus.' }),
      prepared({ index: 2, description: 'A totally unrelated UX role overview.' }),
    ];
    const a = new MinHashStrategy().cluster(inputs);
    const b = new MinHashStrategy().cluster(inputs);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('keeps a 500-input run under 500 ms (NFR-1 sub-budget)', () => {
    const inputs: PreparedJob[] = [];
    for (let i = 0; i < 500; i++) {
      const variant = i % 50;
      const tail = ` Variant ${variant} unique-suffix-${variant}.`;
      inputs.push(prepared({ index: i, description: LONG_DESCRIPTION + tail }));
    }
    const strategy = new MinHashStrategy();
    const start = Date.now();
    const out = strategy.cluster(inputs);
    const elapsed = Date.now() - start;

    // 50 distinct variant texts × 10 identical copies each. Since Spec 722
    // the strategy emits merged components (not one 2-element cluster per
    // verified pair), so the partition itself is the assertion surface:
    // every input index must be covered (each copy-group alone guarantees
    // its members cluster), and every emitted cluster must be a real merge.
    const covered = new Set<number>();
    for (const cluster of out.clusters) {
      expect(cluster.length).toBeGreaterThanOrEqual(2);
      for (const idx of cluster) covered.add(idx);
    }
    expect(covered.size).toBe(500);
    expect(out.clusters.length).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThan(500);
  });
});
