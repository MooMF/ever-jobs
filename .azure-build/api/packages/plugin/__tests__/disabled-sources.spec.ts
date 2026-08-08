import { Site } from '@ever-jobs/models';
import {
  DISABLED_SOURCES_ENV_VAR,
  parseDisabledSources,
  readDisabledSources,
} from '@ever-jobs/plugin';

describe('parseDisabledSources', () => {
  it('returns an empty set for undefined', () => {
    const result = parseDisabledSources(undefined);
    expect(result.size).toBe(0);
  });

  it('returns an empty set for an empty string', () => {
    const result = parseDisabledSources('');
    expect(result.size).toBe(0);
  });

  it('returns an empty set for whitespace-only input', () => {
    const result = parseDisabledSources('   ,  ,  ');
    expect(result.size).toBe(0);
  });

  it('parses a single site id', () => {
    const result = parseDisabledSources('linkedin');
    expect(result.size).toBe(1);
    expect(result.has(Site.LINKEDIN)).toBe(true);
  });

  it('parses a comma-separated list', () => {
    const result = parseDisabledSources('linkedin,indeed,glassdoor');
    expect(result.size).toBe(3);
    expect(result.has(Site.LINKEDIN)).toBe(true);
    expect(result.has(Site.INDEED)).toBe(true);
    expect(result.has(Site.GLASSDOOR)).toBe(true);
  });

  it('tolerates whitespace and empty entries', () => {
    const result = parseDisabledSources(' linkedin , , indeed ,  ');
    expect(result.size).toBe(2);
    expect(result.has(Site.LINKEDIN)).toBe(true);
    expect(result.has(Site.INDEED)).toBe(true);
  });

  it('lower-cases entries (case-insensitive matching)', () => {
    const result = parseDisabledSources('LinkedIn,INDEED');
    expect(result.has(Site.LINKEDIN)).toBe(true);
    expect(result.has(Site.INDEED)).toBe(true);
  });

  it('deduplicates repeated entries', () => {
    const result = parseDisabledSources('linkedin,linkedin,LINKEDIN');
    expect(result.size).toBe(1);
    expect(result.has(Site.LINKEDIN)).toBe(true);
  });

  it('passes through unknown ids untouched (typo guard happens at call site)', () => {
    const result = parseDisabledSources('definitely-not-a-site');
    expect(result.size).toBe(1);
    // The Set holds the literal string; the discovery service is responsible
    // for warning that no matching plugin exists.
    expect(result.has('definitely-not-a-site' as Site)).toBe(true);
  });
});

describe('readDisabledSources', () => {
  it('reads from the configured env-var name', () => {
    const env = { [DISABLED_SOURCES_ENV_VAR]: 'linkedin, indeed' } as NodeJS.ProcessEnv;
    const result = readDisabledSources(env);
    expect(result.has(Site.LINKEDIN)).toBe(true);
    expect(result.has(Site.INDEED)).toBe(true);
  });

  it('returns empty set when env-var is missing', () => {
    const result = readDisabledSources({} as NodeJS.ProcessEnv);
    expect(result.size).toBe(0);
  });

  it('uses process.env by default', () => {
    const original = process.env[DISABLED_SOURCES_ENV_VAR];
    process.env[DISABLED_SOURCES_ENV_VAR] = 'glassdoor';
    try {
      const result = readDisabledSources();
      expect(result.has(Site.GLASSDOOR)).toBe(true);
    } finally {
      if (original === undefined) delete process.env[DISABLED_SOURCES_ENV_VAR];
      else process.env[DISABLED_SOURCES_ENV_VAR] = original;
    }
  });
});

describe('DISABLED_SOURCES_ENV_VAR constant', () => {
  it('is the documented name', () => {
    expect(DISABLED_SOURCES_ENV_VAR).toBe('EVER_JOBS_DISABLED_SOURCES');
  });
});
