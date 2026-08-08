/**
 * TypeScript interfaces for the Teamdash public career-page / job-posting state.
 *
 * Teamdash embeds the full page state in every public SSR page as a single
 * `window.context = { ... }` JSON assignment (see `teamdash.constants.ts`).
 * These interfaces model the parsed shape of that blob. All fields are
 * optional / nullable because the blob varies between career-page landings,
 * job-posting landings, and tenant configurations, and may be sparse.
 */

/**
 * A single job summary as it appears inside
 * `career_page_feed_contents["<feedSlug>"][]` on a career-page landing.
 */
export interface TeamdashFeedItem {
  /**
   * Canonical URL of the job posting on the tenant sub-domain.
   * Example: `"https://cr14.teamdash.com/p/job/DJQJDUk1/full-stack-developer"`.
   * The opaque path token (`DJQJDUk1`) is used as the ATS id.
   */
  url?: string | null;

  /** Job title. Example: `"Software Developer"`. */
  title?: string | null;

  /** Free-text location label. Example: `"Tallinn, Estonia"`. */
  location?: string | null;

  /** Optional hero / card image URL for the role. */
  imageUrl?: string | null;

  /** Custom-field raw values configured per tenant (shape varies). */
  customFields?: unknown[] | null;

  /** Custom-field display values (label/value pairs, shape varies). */
  customFieldDisplayValues?: unknown[] | null;
}

/** Meta block within a landing's `data.meta`. */
export interface TeamdashLandingMeta {
  /** Internal landing name (admin label) — not used for output. */
  name?: string | null;
  /** Page / job title. Primary title source on a job-posting landing. */
  title?: string | null;
  /** Hero image URL. */
  imageUrl?: string | null;
  /** Short meta description (often a duplicate of the title). */
  description?: string | null;
}

/**
 * A single content block within `landing.data.blocks[]`. Block `type` values
 * include `LandingHeroBlock`, `LandingBgImageTextBlock`,
 * `LandingHalfVideoTextBlock`, `LandingContactBlock`, etc. The translatable
 * `content` map (language-code → HTML string) carries the description text.
 * `heading` / `subheading` appear on hero blocks.
 */
export interface TeamdashLandingBlock {
  _id?: string | null;
  type?: string | null;
  /** Translatable HTML content keyed by language code (e.g. `{ en: "<p>…" }`). */
  content?: Record<string, string> | string | null;
  /** Hero heading (translatable map or plain string). */
  heading?: Record<string, string> | string | null;
  /** Hero subheading (translatable map or plain string). */
  subheading?: Record<string, string> | string | null;
}

/** A pipeline stage reference embedded on a job-posting landing. */
export interface TeamdashStage {
  id?: number | null;
  name?: string | null;
  project_id?: number | null;
}

/** The `landing` object on both career-page and job-posting landings. */
export interface TeamdashLanding {
  id?: number | null;
  slug?: string | null;
  /** Lifecycle status — `"active"` for live postings. */
  status?: string | null;
  /** Page type, e.g. `"landing"`. */
  page_type?: string | null;
  /** Default language code (e.g. `"en"`). */
  default_language?: string | null;
  /** Canonical public URL of the landing. */
  permalink?: string | null;
  /** Admin display name for the landing. */
  display_name?: string | null;
  /** ISO-8601 creation timestamp (e.g. `"2025-01-21T11:46:41.000000Z"`). */
  created_at?: string | null;
  /** ISO-8601 last-update timestamp. */
  updated_at?: string | null;
  /** Whether the posting is internal-only (skip when true). */
  is_internal?: boolean | null;
  /** Pipeline stage the posting currently sits in. */
  stage?: TeamdashStage | null;
  data?: {
    meta?: TeamdashLandingMeta | null;
    blocks?: TeamdashLandingBlock[] | null;
    theme?: Record<string, unknown> | null;
    settings?: Record<string, unknown> | null;
    version?: string | null;
  } | null;
}

/**
 * The full `window.context` blob embedded in a public Teamdash page.
 * `career_page_feed_contents` is present (and populated) on career-page
 * landings; `landing.full` is true on individual job-posting landings.
 */
export interface TeamdashContext {
  is_landing?: boolean | null;
  /** Tenant sub-domain label (e.g. `"cr14"`). */
  instance_name?: string | null;
  /** True on an individual job-posting landing. */
  full?: boolean | null;
  /** The current landing (career page or job posting). */
  landing?: TeamdashLanding | null;
  /**
   * Map of feed-slug → array of job summaries, present on career-page
   * landings. Empty array when the feed currently has no open roles.
   */
  career_page_feed_contents?: Record<string, TeamdashFeedItem[]> | null;
  /** Available public languages keyed by language code. */
  languages?: Record<string, unknown> | null;
  /** Resolved URL language, when the landing is translatable. */
  url_language?: string | null;
}
