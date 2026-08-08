/**
 * TypeScript interfaces for the Hireology public careers jobs API.
 *
 * The feed (`GET /v2/public/careers/{slug}`, anonymous bearer token) returns a
 * paginated envelope: `{ data: HireologyJob[], count, page, page_size }`. Field
 * names mirror the real wire shape, which is `snake_case`. Optional `camelCase`
 * aliases are modelled defensively so minor cross-tenant drift never breaks the
 * parser.
 */

/** A nested location object as returned in a job's `locations` array. */
export interface HireologyLocation {
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  zipCode?: string | null;
  address?: string | null;
  country?: string | null;
}

/** The job's organization/tenant descriptor. */
export interface HireologyOrganization {
  id?: number | string | null;
  name?: string | null;
  /** e.g. "Company" / "Group" — unused in mapping, modelled for completeness. */
  type?: string | null;
}

/** The job's job-family grouping (used as the department label). */
export interface HireologyJobFamily {
  id?: number | string | null;
  name?: string | null;
  global_id?: string | null;
}

/** A single open position as returned in the feed's `data` array. */
export interface HireologyJob {
  /** Stable numeric job id — used as the ATS id and the job-detail URL segment. */
  id?: number | string | null;

  /** Primary title field; aliases are defensive fallbacks. */
  name?: string | null;
  title?: string | null;
  seo_page_title?: string | null;

  /** HTML job description. */
  job_description?: string | null;
  jobDescription?: string | null;
  /** Plain-text SEO summary (defensive fallback when no HTML body is present). */
  seo_description?: string | null;

  /** ISO-8601 creation/posted date (e.g. "2026-05-08T18:32:10.808Z"). */
  created_at?: string | number | null;
  createdAt?: string | number | null;
  updated_at?: string | number | null;

  /** Posting status (e.g. "Open"). */
  status?: string | null;

  /** Free-text employment status (e.g. "Full Time - base plus commission"). */
  employment_status?: string | null;
  employmentStatus?: string | null;

  /** Explicit remote flag emitted by the feed. */
  remote?: boolean | null;

  /** Structured locations array (city/state/zip/address). */
  locations?: HireologyLocation[] | null;

  /** Tenant / organization descriptor. */
  organization?: HireologyOrganization | null;

  /** Job-family grouping → department label. */
  job_family?: HireologyJobFamily | null;
  jobFamily?: HireologyJobFamily | null;

  /** Absolute public job-detail URL (preferred when present). */
  career_site_url?: string | null;
  careerSiteUrl?: string | null;
  /** Root-relative public job-detail path (e.g. "/{slug}/{id}/description"). */
  career_site_path?: string | null;
  careerSitePath?: string | null;

  /** Root-relative apply path (e.g. "/careers/{id}/application"). */
  application_path?: string | null;
  applicationPath?: string | null;
}

/** The paginated feed envelope returned by `/v2/public/careers/{slug}`. */
export interface HireologyJobsResponse {
  data?: HireologyJob[] | null;
  count?: number | null;
  page?: number | null;
  page_size?: number | null;
}
