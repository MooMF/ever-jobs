import { Site } from '@ever-jobs/models';

/**
 * Coarse-grained category used to rank candidate field values.
 *
 * Matches the spec's FR-5 precedence ladder
 * (`ATS > company > job-board > niche`) plus a few practical extras the
 * source plugins already use (`remote`, `government`, `regional`,
 * `freelance`).
 *
 * The literal union mirrors `PluginCategory` from `@ever-jobs/plugin` —
 * we duplicate it here only so the resolver can stay free of a runtime
 * dependency on the plugin package.
 */
export type MergeCategory =
  | 'ats'
  | 'company'
  | 'job-board'
  | 'remote'
  | 'government'
  | 'regional'
  | 'freelance'
  | 'niche';

/**
 * Tunables for {@link MergeDefaultService}. Every option has a defensible
 * default so the resolver works zero-config.
 */
export interface MergeDefaultOptions {
  /**
   * Site → category lookup. Sites not in the map fall back to
   * {@link MergeDefaultOptions.fallbackCategory} (default `'job-board'`).
   *
   * The default map (`SITE_CATEGORY_DEFAULTS`) classifies every Site that
   * exists at the time of writing — see `site-category-defaults.ts`.
   */
  readonly siteCategoryMap?: ReadonlyMap<Site, MergeCategory>;

  /**
   * Category used when {@link MergeDefaultOptions.siteCategoryMap} has no
   * entry for a Site. Default `'job-board'` matches the FR-5 mid-tier.
   */
  readonly fallbackCategory?: MergeCategory;

  /**
   * Categories ranked from highest precedence to lowest. Default ordering
   * (FR-5 + practical extras):
   *
   *   `ats > company > job-board > regional > government > remote > freelance > niche`
   *
   * Entries omitted from this list are appended to the tail in default
   * order, so callers only need to override the prefix.
   */
  readonly categoryPriority?: ReadonlyArray<MergeCategory>;

  /**
   * Per-field category-priority overrides. Useful when one field follows a
   * different ranking than the global one — e.g. compensation fields tend
   * to be more accurate from ATS than from boards, while description text
   * is often higher quality on the original company page.
   *
   * Map key = field name (e.g. `"description"`, `"compensation"`).
   * Map value = full priority list (no fallback merging — it overrides
   * the default ladder for that field).
   */
  readonly fieldOverrides?: ReadonlyMap<string, ReadonlyArray<MergeCategory>>;

  /**
   * When `true` (default), candidates within the same category tier are
   * tie-broken by the most recent `_observedAt`. Set `false` to keep the
   * first-seen order — useful in deterministic golden-set tests.
   */
  readonly preferRecent?: boolean;
}
