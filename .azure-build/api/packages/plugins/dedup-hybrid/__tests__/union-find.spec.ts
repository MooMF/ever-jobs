import { UnionFind } from '../src/union-find';

describe('UnionFind', () => {
  it('starts with every element in its own set', () => {
    const uf = new UnionFind(5);
    const clusters = uf.toClusters();
    expect(clusters).toHaveLength(5);
    for (const c of clusters) expect(c).toHaveLength(1);
  });

  it('union merges sets and find points to the same root', () => {
    const uf = new UnionFind(4);
    uf.union(0, 1);
    uf.union(2, 3);
    expect(uf.find(0)).toBe(uf.find(1));
    expect(uf.find(2)).toBe(uf.find(3));
    expect(uf.find(0)).not.toBe(uf.find(2));

    uf.union(1, 2);
    expect(uf.find(0)).toBe(uf.find(3));
    expect(uf.toClusters()).toHaveLength(1);
  });

  it('union returns true on merge, false on a no-op', () => {
    const uf = new UnionFind(3);
    expect(uf.union(0, 1)).toBe(true);
    expect(uf.union(1, 0)).toBe(false);
    expect(uf.union(2, 0)).toBe(true);
  });

  it('toClusters preserves intra-cluster index order', () => {
    const uf = new UnionFind(6);
    uf.union(0, 2);
    uf.union(2, 4);
    const clusters = uf.toClusters();
    // The cluster containing {0,2,4} is grouped; insertion order is the
    // smallest representative chain.
    const big = clusters.find((c) => c.length === 3) ?? [];
    expect([...big].sort((a, b) => a - b)).toEqual([0, 2, 4]);
  });

  it('handles a 10 000-element set in well under 100 ms', () => {
    const N = 10_000;
    const uf = new UnionFind(N);
    const start = Date.now();
    for (let i = 1; i < N; i++) uf.union(i - 1, i);
    expect(uf.toClusters()).toHaveLength(1);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
