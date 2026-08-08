/**
 * TypeScript interfaces for the Polymer public careers jobs API.
 *
 * The list feed (`GET /v1/hire/organizations/{slug}/jobs`) returns a paginated
 * `{ items, meta }` envelope; the per-job detail endpoint
 * (`GET .../jobs/{id}`) returns the same row plus the HTML `description` and a
 * `department`. Field names mirror the real wire shape, which is snake_case.
 * A few camelCase aliases are modelled defensively so minor cross-tenant drift
 * never breaks the parser.
 */

/** A single open position as returned in the `items[]` of the list feed. */
export interface PolymerJob {
  /** Numeric job identifier — used as the ATS id. */
  id?: number | string | null;
  job_id?: number | string | null;
  jobId?: number | string | null;

  /** URL-safe job identifier (alternative public key). */
  hash_id?: string | null;
  hashId?: string | null;

  /** Position title. */
  title?: string | null;

  /** Structured location parts. */
  city?: string | null;
  state_region?: string | null;
  stateRegion?: string | null;
  country?: string | null;
  /** Pre-formatted location label (e.g. "Charlotte, NC"). */
  display_location?: string | null;
  displayLocation?: string | null;

  /** Remote-work classification (e.g. "Remote", "Hybrid", "In-office"). */
  remoteness_pretty?: string | null;
  remotenessPretty?: string | null;

  /** Employment type display label (e.g. "Full-time"). */
  kind_pretty?: string | null;
  kindPretty?: string | null;
  /** Raw employment-type key (detail endpoint). */
  kind?: string | null;

  /** Public application / job-detail page URL. */
  job_post_url?: string | null;
  jobPostUrl?: string | null;

  /** Tenant / organization display name (e.g. "Aperture Labs"). */
  organization_name?: string | null;
  organizationName?: string | null;

  /** Job category / function display name. */
  job_category_name?: string | null;
  jobCategoryName?: string | null;

  /** Salary display label (free text). */
  salary_pretty?: string | null;
  salaryPretty?: string | null;

  /** ISO-8601 timestamps + epoch-second mirrors. */
  created_at?: string | null;
  createdAt?: string | null;
  published_at?: string | null;
  publishedAt?: string | null;
  created_at_timestamp?: number | null;
  published_at_timestamp?: number | null;

  /** Remote-eligibility country allow-list (unused in mapping). */
  remote_restriction_country_list?: string[] | null;
}

/** A single-job detail document: the list row plus the HTML body + department. */
export interface PolymerJobDetail extends PolymerJob {
  /** HTML job description (only present on the detail endpoint). */
  description?: string | null;
  /** Department label or `null` (only present on the detail endpoint). */
  department?: string | null;
}

/** Pagination / tenant metadata returned alongside `items`. */
export interface PolymerMeta {
  /** Total number of open roles for the tenant (across all pages). */
  total?: number | null;
  /** Number of rows on the current page. */
  count?: number | null;
  /** Current 1-based page number. */
  page?: number | null;
  is_first?: boolean | null;
  is_last?: boolean | null;
  /** Next page number, or `null` on the final page. */
  next_page?: number | null;
  /** Tenant display name (echoed in the envelope). */
  organization_name?: string | null;
}

/** The paginated list envelope returned by `GET .../jobs`. */
export interface PolymerJobsResponse {
  items?: PolymerJob[] | null;
  meta?: PolymerMeta | null;
}
