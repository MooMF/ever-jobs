import { FieldWithProvenance, Site, provenance } from '@ever-jobs/models';
import {
  DEFAULT_CATEGORY_PRIORITY,
  MergeDefaultService,
  SITE_CATEGORY_DEFAULTS,
  MergeCategory,
} from '../src';

const ISO_OLDER = '2026-01-15T08:00:00.000Z';
const ISO_NEWER = '2026-04-26T08:00:00.000Z';

function fp<T>(
  value: T,
  source: Site,
  observedAt: string = ISO_NEWER,
  sourceId: string = 's',
): FieldWithProvenance<T> {
  return provenance(value, source, sourceId, observedAt);
}

describe('MergeDefaultService', () => {
  describe('default ladder', () => {
    let service: MergeDefaultService;

    beforeEach(() => {
      service = new MergeDefaultService();
    });

    it('throws on empty candidate list', () => {
      expect(() => service.merge('title', [])).toThrow(RangeError);
    });

    it('returns the only candidate without consulting the priority list', () => {
      const only = fp('Software Engineer', 'unknown-site' as Site);
      expect(service.merge('title', [only])).toBe(only);
    });

    it('prefers ATS over company over board over niche', () => {
      const ats = fp('From ATS', Site.GREENHOUSE);
      const company = fp('From Company', Site.STRIPE);
      const board = fp('From Board', Site.LINKEDIN);
      const niche = fp('From Niche', Site.HACKERNEWS);

      const winner = service.merge('title', [niche, board, company, ats]);
      expect(winner.value).toBe('From ATS');
      expect(winner._source).toBe(Site.GREENHOUSE);
    });

    it('within ats tier, prefers the most recent observation', () => {
      const older = fp('Old salary', Site.GREENHOUSE, ISO_OLDER, 'a');
      const newer = fp('New salary', Site.LEVER, ISO_NEWER, 'b');
      const winner = service.merge('compensation', [older, newer]);
      expect(winner._sourceId).toBe('b');
      expect(winner.value).toBe('New salary');
    });

    it('falls back to deterministic siteRank when category and recency tie', () => {
      // Both GREENHOUSE & LEVER are ATS, identical observedAt.
      // ENUM_ORDER places GREENHOUSE before LEVER → GREENHOUSE wins.
      const a = fp('A', Site.LEVER, ISO_NEWER, '1');
      const b = fp('B', Site.GREENHOUSE, ISO_NEWER, '2');
      const winner = service.merge('title', [a, b]);
      expect(winner._sourceId).toBe('2');
    });

    it('classifies un-mapped Sites as the fallback category', () => {
      const fakeSite = 'made-up-source' as Site;
      // job-board fallback ⇒ ranks above niche but below ats.
      const board = fp('Fallback', fakeSite);
      const niche = fp('Niche', Site.HACKERNEWS);
      const winner = service.merge('title', [niche, board]);
      expect(winner.value).toBe('Fallback');
    });
  });

  describe('preferRecent = false', () => {
    it('keeps the first-seen winner when category ties', () => {
      const service = new MergeDefaultService({ preferRecent: false });
      const first = fp('first', Site.GREENHOUSE, ISO_OLDER, '1');
      const second = fp('second', Site.GREENHOUSE, ISO_NEWER, '2');
      const winner = service.merge('title', [first, second]);
      // siteRank tie + preferRecent off ⇒ first stays.
      expect(winner._sourceId).toBe('1');
    });
  });

  describe('categoryPriority override', () => {
    it('treats partial overrides as a prefix; remaining categories fill the tail', () => {
      // Caller wants company-direct to outrank ATS; everything else
      // unchanged. The merged ladder is ['company', 'ats', ...rest].
      const service = new MergeDefaultService({
        categoryPriority: ['company', 'ats'],
      });
      const ats = fp('From ATS', Site.GREENHOUSE);
      const company = fp('From Company', Site.STRIPE);
      const winner = service.merge('title', [ats, company]);
      expect(winner.value).toBe('From Company');
      expect(service.describe().priority[0]).toBe('company');
      expect(service.describe().priority[1]).toBe('ats');
    });
  });

  describe('fieldOverrides', () => {
    it('uses a per-field ladder that overrides the global one', () => {
      const fieldOverrides = new Map<string, ReadonlyArray<MergeCategory>>([
        ['description', ['company', 'ats']],
      ]);
      const service = new MergeDefaultService({ fieldOverrides });

      const ats = fp('ATS desc', Site.GREENHOUSE);
      const company = fp('Company desc', Site.STRIPE);

      // For "description", company outranks ATS (override).
      expect(service.merge('description', [ats, company]).value).toBe(
        'Company desc',
      );
      // For "title", default ladder applies — ATS still wins.
      expect(service.merge('title', [ats, company]).value).toBe('ATS desc');
    });

    it('describe() returns the per-field ladder ordered by precedence', () => {
      const service = new MergeDefaultService({
        fieldOverrides: new Map([
          ['compensation', ['ats', 'company', 'job-board']],
        ]),
      });
      const desc = service.describe();
      const compRow = desc.fieldOverrides.find(([f]) => f === 'compensation');
      expect(compRow).toBeDefined();
      expect(compRow?.[1].slice(0, 3)).toEqual([
        'ats',
        'company',
        'job-board',
      ]);
    });
  });

  describe('siteCategoryMap defaults', () => {
    it('exposes a canonical map covering every default ATS plugin', () => {
      const ats = [
        Site.ASHBY,
        Site.GREENHOUSE,
        Site.LEVER,
        Site.WORKABLE,
        Site.WORKDAY,
        Site.SMARTRECRUITERS,
        Site.PERSONIO,
      ];
      for (const s of ats) {
        expect(SITE_CATEGORY_DEFAULTS.get(s)).toBe('ats');
      }
    });

    it('classifies known company-direct Sites correctly', () => {
      const company = [
        Site.AMAZON,
        Site.APPLE,
        Site.MICROSOFT,
        Site.STRIPE,
        Site.OPENAI,
        Site.META,
      ];
      for (const s of company) {
        expect(SITE_CATEGORY_DEFAULTS.get(s)).toBe('company');
      }
    });

    it('classifies major boards as job-board', () => {
      expect(SITE_CATEGORY_DEFAULTS.get(Site.LINKEDIN)).toBe('job-board');
      expect(SITE_CATEGORY_DEFAULTS.get(Site.INDEED)).toBe('job-board');
      expect(SITE_CATEGORY_DEFAULTS.get(Site.GLASSDOOR)).toBe('job-board');
    });

    it('default ladder leads with ats > company > job-board > regional', () => {
      expect(DEFAULT_CATEGORY_PRIORITY.slice(0, 4)).toEqual([
        'ats',
        'company',
        'job-board',
        'regional',
      ]);
    });
  });

  describe('determinism', () => {
    it('produces the same winner regardless of input order', () => {
      const service = new MergeDefaultService();
      const candidates = [
        fp('linkedin', Site.LINKEDIN, ISO_OLDER, '1'),
        fp('greenhouse', Site.GREENHOUSE, ISO_OLDER, '2'),
        fp('stripe', Site.STRIPE, ISO_OLDER, '3'),
        fp('hackernews', Site.HACKERNEWS, ISO_OLDER, '4'),
      ];
      const w1 = service.merge('title', candidates);
      const w2 = service.merge('title', [...candidates].reverse());
      const w3 = service.merge('title', shuffleStable(candidates, 7));
      expect(w1._sourceId).toBe('2');
      expect(w2._sourceId).toBe('2');
      expect(w3._sourceId).toBe('2');
    });
  });

  describe('describe()', () => {
    it('returns a snapshot of the active configuration', () => {
      const service = new MergeDefaultService({
        fallbackCategory: 'niche',
        preferRecent: false,
      });
      const snap = service.describe();
      expect(snap.fallbackCategory).toBe('niche');
      expect(snap.preferRecent).toBe(false);
      expect(snap.priority[0]).toBe('ats');
      expect(snap.siteCategoryMapSize).toBeGreaterThan(100);
    });
  });

  describe('categoryOf()', () => {
    it('returns the configured fallback for un-mapped Sites', () => {
      const service = new MergeDefaultService({ fallbackCategory: 'niche' });
      expect(service.categoryOf('not-a-real-site' as Site)).toBe('niche');
    });

    it('returns the mapped category for known Sites', () => {
      const service = new MergeDefaultService();
      expect(service.categoryOf(Site.GREENHOUSE)).toBe('ats');
      expect(service.categoryOf(Site.STRIPE)).toBe('company');
      expect(service.categoryOf(Site.HACKERNEWS)).toBe('niche');
    });
  });
});

/**
 * Stable shuffle (LCG-driven) so tests stay deterministic across runs.
 */
function shuffleStable<T>(arr: ReadonlyArray<T>, seed: number): T[] {
  const out = arr.slice();
  let state = seed;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
