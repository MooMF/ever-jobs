import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  FieldWithProvenance,
  IMergeResolver,
  Site,
} from '@ever-jobs/models';
import { MergeCategory, MergeDefaultOptions } from './types';
import { SITE_CATEGORY_DEFAULTS } from './site-category-defaults';

/**
 * DI token used by {@link MergeDefaultModule} to optionally supply a
 * partial {@link MergeDefaultOptions} bag. Provide a `useValue` for the
 * token in a parent module to override the resolver's defaults — see
 * `merge-default.module.ts` for the binding wiring.
 */
export const MERGE_DEFAULT_OPTIONS_TOKEN = 'MERGE_DEFAULT_OPTIONS';

/**
 * Default ladder used by {@link MergeDefaultService.resolveCategoryPriority}
 * when the caller does not supply one (or omits some categories from a
 * partial override).
 *
 * `ats > company > job-board > regional > government > remote > freelance > niche`
 *
 * Spec 003 / FR-5 mandates only the first four tiers; the remaining four
 * cover the wider Site enum without requiring callers to enumerate every
 * one.
 */
export const DEFAULT_CATEGORY_PRIORITY: ReadonlyArray<MergeCategory> = [
  'ats',
  'company',
  'job-board',
  'regional',
  'government',
  'remote',
  'freelance',
  'niche',
];

/**
 * Per-Site rank used as the ultimate tie-break inside the same category.
 * Stable, deterministic, and independent of insertion order — important
 * for reproducible golden-set test runs.
 */
function siteRank(site: Site): number {
  // Lower rank = higher precedence. We use the position the Site holds
  // inside the enum's declaration order; that order encodes the team's
  // implicit "more reliable first" intuition (LINKEDIN before INDEED,
  // GREENHOUSE before LEVER, etc.).
  const idx = ENUM_ORDER.indexOf(site);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

const ENUM_ORDER: ReadonlyArray<Site> = Object.values(Site).filter(
  (v): v is Site => typeof v === 'string',
);

/**
 * Default `IMergeResolver` (Spec 003 / FR-4 + FR-5).
 *
 * For each candidate `FieldWithProvenance<T>` the resolver:
 *
 *   1. Looks up the candidate's category via
 *      {@link MergeDefaultOptions.siteCategoryMap}, defaulting to
 *      {@link SITE_CATEGORY_DEFAULTS}.
 *   2. Applies a per-field priority list if one exists in
 *      {@link MergeDefaultOptions.fieldOverrides}, otherwise falls back to
 *      the global ladder ({@link MergeDefaultOptions.categoryPriority} or
 *      {@link DEFAULT_CATEGORY_PRIORITY}).
 *   3. Picks the candidate whose category sits highest in the ladder.
 *   4. Within the same category, prefers the most-recent `_observedAt`
 *      when {@link MergeDefaultOptions.preferRecent} is `true` (default).
 *   5. Within the same category and recency, prefers a deterministic
 *      `siteRank` so the same input always produces the same winner.
 *
 * The resolver is **pure** and **side-effect-free** — safe to call on the
 * dedup hot loop without locks.
 */
@Injectable()
export class MergeDefaultService implements IMergeResolver {
  private readonly siteCategoryMap: ReadonlyMap<Site, MergeCategory>;
  private readonly fallbackCategory: MergeCategory;
  private readonly priority: ReadonlyArray<MergeCategory>;
  private readonly priorityIndex: ReadonlyMap<MergeCategory, number>;
  private readonly fieldOverrides: ReadonlyMap<
    string,
    ReadonlyMap<MergeCategory, number>
  >;
  private readonly preferRecent: boolean;

  constructor(
    @Optional()
    @Inject(MERGE_DEFAULT_OPTIONS_TOKEN)
    options?: MergeDefaultOptions,
  ) {
    options = options ?? {};
    this.siteCategoryMap = options.siteCategoryMap ?? SITE_CATEGORY_DEFAULTS;
    this.fallbackCategory = options.fallbackCategory ?? 'job-board';
    this.priority = mergePriority(
      options.categoryPriority,
      DEFAULT_CATEGORY_PRIORITY,
    );
    this.priorityIndex = toIndexMap(this.priority);
    this.fieldOverrides = freezeFieldOverrides(options.fieldOverrides);
    this.preferRecent = options.preferRecent ?? true;
  }

  /**
   * Pick the winning candidate for a single field.
   *
   * @throws RangeError when `candidates` is empty — the dedup engine
   *   should never call us with no observations.
   */
  merge<T>(
    fieldName: string,
    candidates: ReadonlyArray<FieldWithProvenance<T>>,
  ): FieldWithProvenance<T> {
    if (candidates.length === 0) {
      throw new RangeError(
        `MergeDefaultService.merge: no candidates supplied for field "${fieldName}"`,
      );
    }
    if (candidates.length === 1) return candidates[0];

    const rankFor = this.fieldOverrides.get(fieldName) ?? this.priorityIndex;

    let winner = candidates[0];
    let winnerCategoryRank = this.rankFor(winner._source, rankFor);
    let winnerObservedAt = parseObservedAt(winner._observedAt);
    let winnerSiteRank = siteRank(winner._source);

    for (let i = 1; i < candidates.length; i++) {
      const c = candidates[i];
      const cRank = this.rankFor(c._source, rankFor);

      if (cRank < winnerCategoryRank) {
        winner = c;
        winnerCategoryRank = cRank;
        winnerObservedAt = parseObservedAt(c._observedAt);
        winnerSiteRank = siteRank(c._source);
        continue;
      }
      if (cRank > winnerCategoryRank) continue;

      // Same category — tie-break on recency, then on siteRank.
      const cObs = parseObservedAt(c._observedAt);
      if (this.preferRecent && cObs > winnerObservedAt) {
        winner = c;
        winnerObservedAt = cObs;
        winnerSiteRank = siteRank(c._source);
        continue;
      }
      if (this.preferRecent && cObs < winnerObservedAt) continue;

      const cSite = siteRank(c._source);
      if (cSite < winnerSiteRank) {
        winner = c;
        winnerSiteRank = cSite;
      }
    }
    return winner;
  }

  /**
   * Look up a Site's category via the configured map, falling back to
   * {@link MergeDefaultOptions.fallbackCategory} for un-classified Sites.
   * Exported for tests and the dedup engine's diagnostics path.
   */
  categoryOf(site: Site): MergeCategory {
    return this.siteCategoryMap.get(site) ?? this.fallbackCategory;
  }

  /**
   * Numeric rank of a Site under a given priority index. Lower = better.
   * Sites whose category is not in the index land at `Number.MAX_SAFE_INTEGER`,
   * forcing them behind every ranked candidate.
   */
  private rankFor(
    site: Site,
    index: ReadonlyMap<MergeCategory, number>,
  ): number {
    const cat = this.categoryOf(site);
    const r = index.get(cat);
    return r === undefined ? Number.MAX_SAFE_INTEGER : r;
  }

  /**
   * Snapshot the resolver's effective configuration. Useful for logs and
   * the `/api/health` endpoint.
   */
  describe(): {
    fallbackCategory: MergeCategory;
    priority: ReadonlyArray<MergeCategory>;
    fieldOverrides: ReadonlyArray<[string, ReadonlyArray<MergeCategory>]>;
    preferRecent: boolean;
    siteCategoryMapSize: number;
  } {
    const fields: Array<[string, ReadonlyArray<MergeCategory>]> = [];
    for (const [field, idx] of this.fieldOverrides) {
      const ordered = [...idx.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([cat]) => cat);
      fields.push([field, ordered]);
    }
    return {
      fallbackCategory: this.fallbackCategory,
      priority: this.priority,
      fieldOverrides: fields,
      preferRecent: this.preferRecent,
      siteCategoryMapSize: this.siteCategoryMap.size,
    };
  }
}

/**
 * Combine a partial override list with the default ladder. The override
 * keeps its order, then any default categories not mentioned are appended
 * (in default order) so the resolver always knows how to rank every
 * `MergeCategory` value.
 */
function mergePriority(
  override: ReadonlyArray<MergeCategory> | undefined,
  defaults: ReadonlyArray<MergeCategory>,
): ReadonlyArray<MergeCategory> {
  if (!override || override.length === 0) return defaults;
  const seen = new Set<MergeCategory>(override);
  const tail = defaults.filter((c) => !seen.has(c));
  return [...override, ...tail];
}

/**
 * Convert a category list into a `category → rank-index` map for O(1)
 * lookup on the hot path.
 */
function toIndexMap(
  categories: ReadonlyArray<MergeCategory>,
): ReadonlyMap<MergeCategory, number> {
  const m = new Map<MergeCategory, number>();
  for (let i = 0; i < categories.length; i++) m.set(categories[i], i);
  return m;
}

/**
 * Freeze every per-field override list into its own ranking index, again
 * extending with whatever categories were omitted so the resolver can
 * still rank candidates whose Site falls outside the override's coverage.
 */
function freezeFieldOverrides(
  overrides: ReadonlyMap<string, ReadonlyArray<MergeCategory>> | undefined,
): ReadonlyMap<string, ReadonlyMap<MergeCategory, number>> {
  if (!overrides || overrides.size === 0) return new Map();
  const out = new Map<string, ReadonlyMap<MergeCategory, number>>();
  for (const [field, list] of overrides) {
    const merged = mergePriority(list, DEFAULT_CATEGORY_PRIORITY);
    out.set(field, toIndexMap(merged));
  }
  return out;
}

/**
 * Parse an ISO-8601 timestamp into milliseconds-since-epoch. Returns
 * `Number.NEGATIVE_INFINITY` for unparseable values so they always lose
 * the recency tie-break.
 */
function parseObservedAt(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}
