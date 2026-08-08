/**
 * TypeScript interfaces for the Symphony Talent / SmashFlyX public careers surface.
 *
 * Symphony Talent tenant career sites consume one shared, public, anonymous JSON jobs API at
 * `GET https://jobsapi-internal.m-cloud.io/api/job?Organization={orgId}&Limit={n}&offset={k}`,
 * which returns a flat envelope `{ aggregations, titles, totalHits, queryResult }`. The
 * adapter GETs this feed, advances `offset` to drain pages bounded by `totalHits`, and reads
 * `queryResult[]`. The interfaces below describe the subset of that wire shape the adapter
 * reads plus the normalised internal role assembled from it. Everything the adapter reads is
 * optional and defensively narrowed at parse time, so cross-tenant or future-shape drift
 * never breaks the parser.
 */

/**
 * A single role as returned in the public feed's `queryResult[]`. Only the fields the
 * adapter consumes are modelled; all are optional and defensively narrowed. The numeric `id`
 * is the stable per-role ATS id; `url` is the canonical public detail page.
 */
export interface SymphonyTalentJobItem {
  /** Stable numeric role id — the ATS id (e.g. `23398009`). May arrive as a number or string. */
  id?: number | string | null;
  /** Role display title. */
  title?: string | null;
  /** Rendered HTML role description body. */
  description?: string | null;
  /** Tenant brand / company display name (e.g. `Symphony Talent`) — the feed carries it. */
  company_name?: string | null;
  /** Primary city (e.g. `Atlanta`). */
  primary_city?: string | null;
  /** Primary state / region code (e.g. `GA`). */
  primary_state?: string | null;
  /** Primary country code (e.g. `US`). */
  primary_country?: string | null;
  /** Primary postal / ZIP code. */
  primary_zip?: string | null;
  /** Free-text primary street address, when present. */
  primary_address?: string | null;
  /** Additional location lines, when the role spans multiple sites. */
  addtnl_locations?: unknown[] | null;
  /** Department label (e.g. `Implementation & Project Management`). */
  department?: string | null;
  /** Primary job category / family (e.g. `Project Management`). */
  primary_category?: string | null;
  /** Secondary job category, when present. */
  sub_category?: string | null;
  /** Job function (e.g. `Project Manager`). */
  function?: string | null;
  /** Employment-type label (e.g. `Exempt`, `Full Time`, `Contract`). */
  employment_type?: string | null;
  /** Raw job-type token, when present. */
  job_type?: string | null;
  /** Work-arrangement token (e.g. `Remote`, `Onsite`, `Hybrid`). */
  location_type?: string | null;
  /** ISO publish timestamp (e.g. `2026-05-18T16:02:35.22Z`). */
  open_date?: string | null;
  /** ISO last-update timestamp. */
  update_date?: string | null;
  /** Canonical public detail URL (`{careerHost}/job/{id}/{seo-slug}`). */
  url?: string | null;
  /** Apply / tracking redirect URL the career site links to. */
  fndly_url?: string | null;
  /** SEO slug fragment, when the feed pre-computes one. */
  seo_url?: string | null;
  /** Tenant reference code for the requisition, when present. */
  ref?: string | null;
  /** Org id echoed back on the role (numeric). */
  scout_orgid?: number | string | null;
}

/**
 * The top-level public feed envelope `{ aggregations, titles, totalHits, queryResult }`.
 * Only the path the adapter walks is modelled; `queryResult` is narrowed to an array at
 * parse time and `totalHits` drives the page drain.
 */
export interface SymphonyTalentJobsResponse {
  /** Total published roles matching the query across all pages. */
  totalHits?: number | null;
  /** The open roles on this page. */
  queryResult?: SymphonyTalentJobItem[] | null;
  /** Facet aggregations (unused by the adapter). */
  aggregations?: unknown;
  /** Title autocomplete suggestions (unused by the adapter). */
  titles?: unknown;
}

/**
 * Normalised view of a single Symphony Talent role, ready to map to a JobPostDto.
 */
export interface SymphonyTalentJob {
  /** Stable ATS id (the role `id`, stringified — e.g. `23398009`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `url`). */
  url: string;

  /** Absolute public apply URL (the `fndly_url` tracker, else the detail URL). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (the feed's `company_name`, else the org id). */
  companyName?: string | null;

  /** Structured location parts derived from the role's primary location fields. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from `department` (else `primary_category`). */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`). */
  employmentType?: string | null;

  /** Posted date — parsed from `open_date`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
