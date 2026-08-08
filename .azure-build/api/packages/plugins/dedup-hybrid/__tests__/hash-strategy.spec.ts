import { HashStrategy } from '../src/strategies/hash-strategy';
import { PreparedJob } from '../src/types';
import { JobPostDto } from '@ever-jobs/models';

function prepared(index: number, canonicalJobId: string): PreparedJob {
  return {
    index,
    canonicalJobId,
    canonicalKey: `key:${canonicalJobId}`,
    raw: new JobPostDto({ title: 't', companyName: 'c', jobUrl: 'https://x.test' }),
  };
}

describe('HashStrategy', () => {
  const strategy = new HashStrategy();

  it('exposes a stable strategy name', () => {
    expect(strategy.name).toBe('hash');
  });

  it('returns one cluster per id when all ids are unique', () => {
    const input = [prepared(0, 'a'), prepared(1, 'b'), prepared(2, 'c')];
    const { clusters } = strategy.cluster(input);
    expect(clusters).toHaveLength(3);
    for (const cluster of clusters) expect(cluster).toHaveLength(1);
  });

  it('groups inputs that share a canonicalJobId', () => {
    const input = [
      prepared(0, 'a'),
      prepared(1, 'a'),
      prepared(2, 'b'),
      prepared(3, 'a'),
    ];
    const { clusters } = strategy.cluster(input);
    expect(clusters).toHaveLength(2);

    const aCluster = clusters.find((c) => c.length === 3);
    const bCluster = clusters.find((c) => c.length === 1);
    expect(aCluster).toEqual([0, 1, 3]);
    expect(bCluster).toEqual([2]);
  });

  it('returns an empty partition for empty input', () => {
    expect(strategy.cluster([]).clusters).toEqual([]);
  });

  it('keeps cluster output deterministic across runs', () => {
    const input = [prepared(0, 'x'), prepared(1, 'x'), prepared(2, 'y')];
    const a = strategy.cluster(input);
    const b = strategy.cluster(input);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('clusters 1 000 inputs with 50 distinct ids in well under 25 ms', () => {
    const input: PreparedJob[] = [];
    for (let i = 0; i < 1000; i++) {
      input.push(prepared(i, `bucket-${i % 50}`));
    }
    const start = Date.now();
    const { clusters } = strategy.cluster(input);
    expect(clusters).toHaveLength(50);
    expect(Date.now() - start).toBeLessThan(25);
  });
});
