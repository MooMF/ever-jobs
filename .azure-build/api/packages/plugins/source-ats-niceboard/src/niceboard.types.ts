/**
 * TypeScript interfaces for the Niceboard public board search API.
 *
 * The feed (`GET /api/jobs`) returns `{ jobs: NiceboardJob[], count, ... }`.
 * Field names mirror the real wire shape, which is `snake_case`. A few
 * `camelCase` aliases are modelled defensively so minor cross-tenant or
 * version drift never breaks the parser.
 */

/** Embedded location object on a job (present when the role is geo-tagged). */
export interface NiceboardLocation {
  id?: number | null;
  /** Full display label, e.g. "Denver, CO, USA". */
  name?: string | null;
  slug?: string | null;
  city_short?: string | null;
  city_long?: string | null;
  state_short?: string | null;
  state_long?: string | null;
  country_short?: string | null;
  country_long?: string | null;
  location?: { lat?: number | null; lon?: number | null } | null;
}

/** Embedded employer object on a job. */
export interface NiceboardCompany {
  id?: number | null;
  name?: string | null;
  slug?: string | null;
  site_url?: string | null;
  tagline?: string | null;
  description_html?: string | null;
  logo_url?: string | null;
  is_verified?: boolean | null;
}

/** Embedded category / job-type lookup object. */
export interface NiceboardLookup {
  id?: number | null;
  name?: string | null;
  slug?: string | null;
}

/** A single open position as returned by `/api/jobs`. */
export interface NiceboardJob {
  /** Stable numeric job id — used as the ATS id and the job-detail URL segment. */
  id?: number | string | null;
  /** Short opaque public id (alternative external reference). */
  uid?: string | null;

  /** Primary title field; camelCase alias is a defensive fallback. */
  title?: string | null;
  jobTitle?: string | null;

  /** URL slug used to build the public job-detail page. */
  slug?: string | null;

  /** Free-text location label (often null when a structured `location` exists). */
  location_name?: string | null;
  /** Structured location object (city / state / country). */
  location?: NiceboardLocation | null;

  /** HTML job description; camelCase alias is a defensive fallback. */
  description_html?: string | null;
  descriptionHtml?: string | null;

  /** Remote flags. */
  is_remote?: boolean | null;
  remote_only?: boolean | null;
  /** Free-text preferred-location note for remote roles. */
  remote_required_location?: string | null;

  /** Apply routing — at most one of these is populated. */
  apply_by_form?: boolean | null;
  apply_url?: string | null;
  apply_email?: string | null;
  how_to_apply?: string | null;

  /** ISO-8601 publish timestamp; aliases cover scheduled/created fallbacks. */
  published_at?: string | number | null;
  publishedAt?: string | number | null;
  scheduled_at?: string | number | null;
  created_at?: string | number | null;

  /** Compensation hints (unused in mapping, modelled for completeness). */
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_timeframe?: string | null;

  /** Structured + flattened employer fields. */
  company?: NiceboardCompany | null;
  company_name?: string | null;
  company_slug?: string | null;
  company_website?: string | null;
  company_logo?: string | null;
  company_tagline?: string | null;

  /** Anonymity flag — when true the detail URL omits the company slug. */
  anonymity_enabled?: boolean | null;

  /** Department / category fields. */
  category?: NiceboardLookup | null;
  jobtype?: NiceboardLookup | null;
  jobtype_slug?: string | null;
}

/** The board search endpoint wraps jobs in an object alongside facet aggregations. */
export interface NiceboardJobsResponse {
  jobs?: NiceboardJob[] | null;
  /** Total open-roles count for the tenant (drives pagination). */
  count?: number | null;
  remote_count?: number | null;
  remote_only_count?: number | null;
}
