import { listSources, compareSources } from '../src/tools';

describe('MCP Tools — listSources', () => {
  it('should return all sources when no type filter', () => {
    const result = listSources('all');
    expect(result.total).toBeGreaterThan(60);
    expect(result.sources.length).toBe(result.total);
  });

  it('should filter by type (job_board)', () => {
    const result = listSources('job_board');
    expect(result.total).toBeGreaterThan(0);
    expect(result.sources.every((s) => s.type === 'job_board')).toBe(true);
  });

  it('should filter by type (ats)', () => {
    const result = listSources('ats');
    expect(result.total).toBeGreaterThan(0);
    expect(result.sources.every((s) => s.type === 'ats')).toBe(true);
  });

  it('should filter by type (company)', () => {
    const result = listSources('company');
    expect(result.total).toBeGreaterThan(0);
    expect(result.sources.every((s) => s.type === 'company')).toBe(true);
  });

  it('should filter by type (remote)', () => {
    const result = listSources('remote');
    expect(result.total).toBeGreaterThan(0);
    expect(result.sources.every((s) => s.type === 'remote')).toBe(true);
  });

  it('should filter by type (aggregator)', () => {
    const result = listSources('aggregator');
    expect(result.total).toBeGreaterThan(0);
    expect(result.sources.every((s) => s.type === 'aggregator')).toBe(true);
  });

  it('should return empty for unknown type', () => {
    const result = listSources('nonexistent');
    expect(result.total).toBe(0);
    expect(result.sources).toEqual([]);
  });

  it('should include Phase 7 sources', () => {
    const result = listSources('all');
    const ids = result.sources.map((s) => s.id);
    expect(ids).toContain('builtin');
    expect(ids).toContain('snagajob');
    expect(ids).toContain('dribbble');
  });

  it('should include company sources', () => {
    const result = listSources('company');
    const ids = result.sources.map((s) => s.id);
    expect(ids).toContain('google_careers');
    expect(ids).toContain('meta');
    expect(ids).toContain('openai');
  });

  it('should mark ATS sources as requiring company_slug', () => {
    const result = listSources('ats');
    expect(result.sources.every((s) => s.requires_company_slug === true)).toBe(true);
  });

  it('should have unique IDs', () => {
    const result = listSources('all');
    const ids = result.sources.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('MCP Tools — compareSources', () => {
  it('should return total count matching listSources', () => {
    const comparison = compareSources();
    const all = listSources('all');
    expect(comparison.total).toBe(all.total);
  });

  it('should break down sources by type', () => {
    const result = compareSources();
    expect(result.byType).toBeDefined();
    expect(Object.keys(result.byType).length).toBeGreaterThan(3);
    const totalFromTypes = Object.values(result.byType).reduce((a, b) => a + b, 0);
    expect(totalFromTypes).toBe(result.total);
  });

  it('should list source names within each type', () => {
    const result = compareSources();
    for (const typeInfo of result.types) {
      expect(typeInfo.sources.length).toBe(typeInfo.count);
      expect(typeInfo.sources.every((s) => typeof s === 'string')).toBe(true);
    }
  });

  it('should identify ATS sources as requiring slug', () => {
    const result = compareSources();
    const ats = result.types.find((t) => t.type === 'ats');
    expect(ats).toBeDefined();
    expect(ats!.requiresSlug).toBe(true);
  });

  it('should have all expected types', () => {
    const result = compareSources();
    const typeNames = result.types.map((t) => t.type);
    expect(typeNames).toContain('job_board');
    expect(typeNames).toContain('ats');
    expect(typeNames).toContain('company');
    expect(typeNames).toContain('remote');
    expect(typeNames).toContain('aggregator');
  });
});
