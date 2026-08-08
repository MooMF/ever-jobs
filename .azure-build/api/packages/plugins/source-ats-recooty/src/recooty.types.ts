/**
 * TypeScript interfaces for the Recooty public Job Widget feed.
 *
 * The feed (`GET /api/widget/{widgetId}`) returns a single envelope object whose
 * `team.jobPosts` array holds the tenant's open roles. Field names mirror the
 * real wire shape, which is `snake_case`. A handful of `camelCase`/`PascalCase`
 * aliases are modelled defensively so minor cross-tenant drift never breaks the
 * parser.
 */

/**
 * Employment-type token. The feed emits one of these enum keys; the i18n
 * `translation` block carries their display labels.
 */
export type RecootyEmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACTOR'
  | 'INTERN'
  | 'OTHER'
  | string;

/** Workplace flexibility token. `REMOTE` flags a remote role. */
export type RecootyLocationType = 'REMOTE' | 'ON_SITE' | 'HYBRID' | string;

/** A single open position as returned in `team.jobPosts[]`. */
export interface RecootyJobPost {
  /** Stable numeric job id — used as the ATS id. */
  id?: number | string | null;

  /** Job display title. */
  title?: string | null;
  job_title?: string | null;

  /** URL-safe job slug — the last path segment of the public job-detail URL. */
  slug?: string | null;

  /** HTML job description. */
  description?: string | null;
  job_description?: string | null;

  /** Structured location parts (free-text city/state; country rarely present). */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Workplace flexibility — `REMOTE` marks a remote role. */
  location_type?: RecootyLocationType | null;

  /** Employment type enum key (e.g. "FULL_TIME"). */
  employment_type?: RecootyEmploymentType | null;

  /** Department display name and/or structured ref. */
  department?: string | { id?: number | string | null; name?: string | null } | null;
  department_name?: string | null;

  /** Industry / category label. */
  industry_type?: string | null;

  /** Compensation band (modelled for completeness; not mapped to JobPostDto). */
  min_pay?: number | string | null;
  max_pay?: number | string | null;
  pay_currency?: string | null;
  pay_interval?: string | null;

  /** Required experience level (enum key, e.g. "INTERNSHIP"). */
  experience_required?: string | null;

  /** ISO-8601 publish timestamp (e.g. "2025-06-09T09:16:10.000000Z"). */
  published_at?: string | number | null;
  created_at?: string | number | null;

  /** Optional absolute apply URL when the feed supplies one. */
  apply_url?: string | null;
}

/** The tenant block carried in the widget envelope. */
export interface RecootyTeam {
  id?: number | string | null;
  /** Tenant display name. */
  name?: string | null;
  /** Tenant slug — the careers-page path segment. */
  slug?: string | null;
  logo?: string | null;
  /** Open roles for the tenant. */
  jobPosts?: RecootyJobPost[] | null;
}

/** Top-level envelope returned by `GET /api/widget/{widgetId}`. */
export interface RecootyWidgetResponse {
  /** Hosted careers-page base (e.g. "https://careerspage.io/"). */
  career_page_url?: string | null;
  team?: RecootyTeam | null;
  /** i18n strings — not job data; ignored by the mapper. */
  translation?: Record<string, unknown> | null;
  /** Present on an invalid/unknown widget id (HTTP 422). */
  error?: boolean | null;
  message?: string | null;
}
