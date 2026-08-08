/**
 * TypeScript interfaces for the Occupop public careers jobs API.
 *
 * The `LiveJobs` GraphQL operation (`POST /graphql`, tenant via the `companyKey`
 * variable) returns `{ data: { careersPage: { liveJobs: CareersPageJob[] } } }`.
 * Field names mirror the real wire shape (camelCase). Optional snake_case /
 * PascalCase aliases are modelled defensively so minor cross-tenant or
 * schema-version drift never breaks the parser.
 */

/** A structured city/country location on a live Occupop job. */
export interface OccupopLocation {
  city?: string | null;
  country?: string | null;
  /** Defensive alias seen on some tenants. */
  region?: string | null;
}

/** Hiring company / brand display name (multi-brand tenants). */
export interface OccupopHiringCompany {
  name?: string | null;
}

/** The sector grouping a sub-sector belongs to (e.g. "Commercial & Marketing"). */
export interface OccupopSector {
  name?: string | null;
}

/** A job's sub-sector (e.g. "Retail") plus its parent sector. */
export interface OccupopSubsector {
  name?: string | null;
  sector?: OccupopSector | null;
}

/** A single live position as returned by `careersPage.liveJobs`. */
export interface OccupopJob {
  /** Stable job GUID — used as the ATS id and the job-detail URL segment. */
  uuid?: string | null;
  id?: string | null;

  /** Primary title field; lower-case alias is a defensive fallback. */
  title?: string | null;

  /** HTML job description. */
  description?: string | null;

  /** Posted timestamp — space-separated datetime (e.g. "2026-05-20 10:34:17"). */
  publishedAt?: string | number | null;
  /** Defensive aliases for the posted date across schema versions. */
  published_at?: string | number | null;
  createdAt?: string | number | null;

  /** Tenant / organization display name (e.g. "The Molloy Group"). */
  companyName?: string | null;

  /** Structured city/country location. */
  location?: OccupopLocation | null;

  /** Hiring brand within a multi-brand tenant. */
  hiringCompany?: OccupopHiringCompany | null;

  /** Employment period / type (e.g. "Fulltime", "Parttime", "Negotiable"). */
  period?: string | null;

  /** Sub-sector list; the first entry's sector is used as the department. */
  subsectors?: OccupopSubsector[] | null;
}

/** The `careersPage` GraphQL field selection used by the `LiveJobs` operation. */
export interface OccupopCareersPage {
  liveJobs?: OccupopJob[] | null;
}

/** Top-level GraphQL response envelope for the `LiveJobs` operation. */
export interface OccupopLiveJobsResponse {
  data?: {
    careersPage?: OccupopCareersPage | null;
  } | null;
  errors?: Array<{ message?: string | null }> | null;
}
