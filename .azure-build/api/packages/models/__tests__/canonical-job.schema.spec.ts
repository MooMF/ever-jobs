import {
  CanonicalJob,
  CanonicalJobSchema,
  FieldWithProvenanceSchema,
  RawJobSchema,
  Site,
  SourceObservationSchema,
} from '@ever-jobs/models';

describe('CanonicalJobSchema (Spec 003 / T03)', () => {
  const fixture: CanonicalJob = {
    canonicalJobId:
      'a'.repeat(64), // valid sha-256 hex digest shape
    title: 'Senior Software Engineer',
    company: 'Acme Corp',
    location: 'Remote — US',
    description: 'Build cool stuff.',
    url: 'https://acme.example.com/jobs/123',
    sources: [
      {
        site: Site.LINKEDIN,
        sourceJobId: 'li-123',
        url: 'https://www.linkedin.com/jobs/view/123',
        observedAt: '2026-04-26T10:00:00Z',
        rawTitle: 'Senior Software Engineer',
      },
      {
        site: Site.GREENHOUSE,
        sourceJobId: 'gh-456',
        url: 'https://boards.greenhouse.io/acme/jobs/456',
        observedAt: '2026-04-26T10:01:00Z',
      },
    ],
    fields: {
      title: {
        value: 'Senior Software Engineer',
        _source: Site.GREENHOUSE,
        _sourceId: 'gh-456',
        _observedAt: '2026-04-26T10:01:00Z',
      },
      company: {
        value: 'Acme Corp',
        _source: Site.GREENHOUSE,
        _sourceId: 'gh-456',
        _observedAt: '2026-04-26T10:01:00Z',
      },
    },
    mergedAt: '2026-04-26T10:02:00Z',
  };

  it('parses a fully-populated fixture', () => {
    const result = CanonicalJobSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it('rejects a non-sha-256 canonicalJobId', () => {
    const result = CanonicalJobSchema.safeParse({ ...fixture, canonicalJobId: 'too-short' });
    expect(result.success).toBe(false);
  });

  it('rejects sources: [] (must have ≥ 1)', () => {
    const result = CanonicalJobSchema.safeParse({ ...fixture, sources: [] });
    expect(result.success).toBe(false);
  });

  it('round-trips via parse → no field mutation', () => {
    const parsed = CanonicalJobSchema.parse(fixture);
    expect(parsed).toEqual(fixture);
  });
});

describe('SourceObservationSchema', () => {
  it('accepts a minimal observation', () => {
    const r = SourceObservationSchema.safeParse({
      site: Site.LEVER,
      sourceJobId: 'lever-1',
      url: 'https://jobs.lever.co/acme/1',
      observedAt: '2026-04-26T10:00:00Z',
    });
    expect(r.success).toBe(true);
  });

  it('rejects bad URL', () => {
    const r = SourceObservationSchema.safeParse({
      site: Site.LEVER,
      sourceJobId: 'lever-1',
      url: 'not-a-url',
      observedAt: '2026-04-26T10:00:00Z',
    });
    expect(r.success).toBe(false);
  });
});

describe('FieldWithProvenanceSchema', () => {
  it('accepts unknown value type', () => {
    const r = FieldWithProvenanceSchema.safeParse({
      value: { nested: 42 },
      _source: Site.INDEED,
      _sourceId: 'in-1',
      _observedAt: '2026-04-26T10:00:00Z',
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty _sourceId', () => {
    const r = FieldWithProvenanceSchema.safeParse({
      value: 'x',
      _source: Site.INDEED,
      _sourceId: '',
      _observedAt: '2026-04-26T10:00:00Z',
    });
    expect(r.success).toBe(false);
  });
});

describe('RawJobSchema', () => {
  it('accepts a minimal raw job', () => {
    const r = RawJobSchema.safeParse({
      site: Site.LINKEDIN,
      sourceJobId: 'li-1',
      title: 'SWE',
      companyName: 'Acme',
      jobUrl: 'https://example.com/1',
    });
    expect(r.success).toBe(true);
  });

  it('rejects missing companyName', () => {
    const r = RawJobSchema.safeParse({
      site: Site.LINKEDIN,
      sourceJobId: 'li-1',
      title: 'SWE',
      jobUrl: 'https://example.com/1',
    });
    expect(r.success).toBe(false);
  });

  it('accepts optional location with nullable fields', () => {
    const r = RawJobSchema.safeParse({
      site: Site.LINKEDIN,
      sourceJobId: 'li-1',
      title: 'SWE',
      companyName: 'Acme',
      jobUrl: 'https://example.com/1',
      location: { city: 'Berlin', state: null, country: 'Germany' },
    });
    expect(r.success).toBe(true);
  });
});
