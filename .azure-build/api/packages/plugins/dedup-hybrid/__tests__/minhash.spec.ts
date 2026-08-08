import {
  MinHasher,
  lshBandKeys,
  shingleHashes,
  signatureSimilarity,
  tokenizeForShingles,
} from '../src/minhash';

describe('tokenizeForShingles', () => {
  it('lowercases and strips non-alphanumerics', () => {
    expect(tokenizeForShingles('Hello, WORLD!  --  Foo_Bar')).toEqual([
      'hello',
      'world',
      'foo',
      'bar',
    ]);
  });

  it('returns [] for blank text', () => {
    expect(tokenizeForShingles('')).toEqual([]);
    expect(tokenizeForShingles('   ')).toEqual([]);
    expect(tokenizeForShingles('!!!---???')).toEqual([]);
  });

  it('preserves digits', () => {
    expect(tokenizeForShingles('Senior Engineer 2 (Backend)')).toEqual([
      'senior',
      'engineer',
      '2',
      'backend',
    ]);
  });
});

describe('shingleHashes', () => {
  it('emits one shingle per (n - k + 1) window for k-grams', () => {
    const shingles = shingleHashes('the quick brown fox jumps over the lazy dog', 3);
    // tokens length = 9, k = 3 ⇒ 7 unique 3-grams (no repeats here).
    expect(shingles.size).toBe(7);
  });

  it('falls back to a single shingle when text has fewer tokens than k', () => {
    const shingles = shingleHashes('hi there', 5);
    expect(shingles.size).toBe(1);
  });

  it('returns an empty set for empty text', () => {
    expect(shingleHashes('', 3).size).toBe(0);
  });

  it('produces deterministic hashes across calls', () => {
    const a = [...shingleHashes('alpha beta gamma delta', 3)].sort();
    const b = [...shingleHashes('alpha beta gamma delta', 3)].sort();
    expect(a).toEqual(b);
  });
});

describe('MinHasher', () => {
  it('produces a signature of the configured length', () => {
    const hasher = new MinHasher({ signatureSize: 64 });
    const sig = hasher.signature(loremText());
    expect(sig).not.toBeNull();
    expect(sig!.length).toBe(64);
  });

  it('returns null when text yields no shingles', () => {
    const hasher = new MinHasher({ signatureSize: 32 });
    expect(hasher.signature('')).toBeNull();
    expect(hasher.signature('!!!')).toBeNull();
  });

  it('estimates Jaccard ≈ 1.0 for identical inputs', () => {
    const hasher = new MinHasher({ signatureSize: 128 });
    const a = hasher.signature(loremText())!;
    const b = hasher.signature(loremText())!;
    expect(signatureSimilarity(a, b)).toBe(1);
  });

  it('estimates high similarity for near-duplicate inputs', () => {
    const hasher = new MinHasher({ signatureSize: 128, seed: 0xdeadbeef });
    const original = loremText();
    // Append a short tail rather than mutating words inline. Each in-text
    // `replace()` rewrites several occurrences and drops similarity well
    // below 0.8 (empirically ~0.72 with seed 0xdeadbeef). The dedup
    // strategy default threshold is 0.85 against an appended-tail tweak,
    // which is the realistic "near duplicate" surface — this test
    // mirrors that shape.
    const tweaked = original + ' Bonus mention. Visa sponsorship offered.';
    const a = hasher.signature(original)!;
    const b = hasher.signature(tweaked)!;
    expect(signatureSimilarity(a, b)).toBeGreaterThan(0.8);
  });

  it('estimates low similarity for clearly different inputs', () => {
    const hasher = new MinHasher({ signatureSize: 128 });
    const a = hasher.signature(loremText())!;
    const b = hasher.signature(
      'We are looking for a passionate UX designer with experience in Figma, ' +
        'user research, and design-system stewardship. Remote-friendly.',
    )!;
    expect(signatureSimilarity(a, b)).toBeLessThan(0.2);
  });

  it('produces deterministic signatures for the same options + seed', () => {
    const a = new MinHasher({ signatureSize: 64, seed: 0x1234 }).signature(loremText())!;
    const b = new MinHasher({ signatureSize: 64, seed: 0x1234 }).signature(loremText())!;
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('different seeds yield different signatures for the same text', () => {
    const a = new MinHasher({ signatureSize: 64, seed: 0x1 }).signature(loremText())!;
    const b = new MinHasher({ signatureSize: 64, seed: 0x2 }).signature(loremText())!;
    // Element-wise equality across all positions is astronomically unlikely.
    let same = 0;
    for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
    expect(same).toBeLessThan(a.length);
  });

  it('rejects invalid configuration', () => {
    expect(() => new MinHasher({ signatureSize: 0 })).toThrow();
    expect(() => new MinHasher({ shingleSize: 0 })).toThrow();
  });

  it('matches the pre-722 golden signature byte-for-byte (Spec 722 / FR-2)', () => {
    // Captured from the implementation as it stood before the Spec 722 hot-loop
    // restructure (default options: signatureSize 128, shingleSize 3, seed
    // 0xCAFEBABE). The refactor inlined the permutation arithmetic and swapped
    // the loop order; the constants and fold order are unchanged, so these
    // values must never drift. If this test fails, signatures — and therefore
    // every persisted LSH bucket and similarity verdict — changed semantics.
    const sig = new MinHasher({}).signature(
      'We are hiring a Senior Software Engineer to join our backend platform team. ' +
        'You will design, build, and operate distributed systems running on Kubernetes.',
    )!;
    expect(sig.length).toBe(128);
    expect(Array.from(sig.slice(0, 8))).toEqual([
      339505291, 692446097, 461289395, 326757424, 129337285, 250433582, 300526700, 16184326,
    ]);
    expect(sig[64]).toBe(567718026);
    expect(sig[127]).toBe(221719532);
  });
});

describe('lshBandKeys', () => {
  it('returns one key per band', () => {
    const sig = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const keys = lshBandKeys(sig, 4);
    expect(keys).toHaveLength(4);
    expect(new Set(keys).size).toBe(4);
  });

  it('throws if signatureSize is not divisible by bands', () => {
    const sig = new Uint32Array([1, 2, 3, 4, 5, 6, 7]);
    expect(() => lshBandKeys(sig, 3)).toThrow(/divisible/);
  });

  it('produces matching keys for identical signatures', () => {
    const a = new Uint32Array([7, 7, 7, 7, 7, 7, 7, 7]);
    const b = new Uint32Array([7, 7, 7, 7, 7, 7, 7, 7]);
    expect(lshBandKeys(a, 4)).toEqual(lshBandKeys(b, 4));
  });

  it('produces no shared keys for fully distinct signatures', () => {
    const a = new Uint32Array([1, 1, 1, 1]);
    const b = new Uint32Array([2, 2, 2, 2]);
    const ka = new Set(lshBandKeys(a, 2));
    const kb = new Set(lshBandKeys(b, 2));
    for (const k of ka) expect(kb.has(k)).toBe(false);
  });
});

describe('signatureSimilarity', () => {
  it('returns 0 for empty signatures', () => {
    expect(signatureSimilarity(new Uint32Array(), new Uint32Array())).toBe(0);
  });

  it('returns 1 for identical signatures', () => {
    const sig = new Uint32Array([1, 2, 3, 4]);
    expect(signatureSimilarity(sig, sig)).toBe(1);
  });

  it('returns the per-element-equality fraction', () => {
    const a = new Uint32Array([1, 2, 3, 4]);
    const b = new Uint32Array([1, 2, 9, 9]);
    expect(signatureSimilarity(a, b)).toBeCloseTo(0.5, 5);
  });

  it('throws on length mismatch', () => {
    const a = new Uint32Array([1, 2, 3]);
    const b = new Uint32Array([1, 2]);
    expect(() => signatureSimilarity(a, b)).toThrow();
  });
});

function loremText(): string {
  return (
    'We are hiring a Senior Software Engineer to join our backend platform team. ' +
    'You will design, build, and operate distributed systems running on Kubernetes. ' +
    'The ideal candidate has strong experience with TypeScript, NestJS, and PostgreSQL, ' +
    'as well as 5+ years of production-grade engineering experience. ' +
    'We offer a competitive salary, equity, and a remote-friendly work environment.'
  );
}
