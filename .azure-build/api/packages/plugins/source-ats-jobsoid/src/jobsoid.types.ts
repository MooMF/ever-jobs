/**
 * TypeScript interfaces for the Jobsoid public careers JSON API.
 *
 * The wire shape is `camelCase` as returned by the public feed at
 * `GET https://{tenant}.jobsoid.com/api/v1/jobs`. Field names mirror the real
 * wire shape; every field is optional/nullable to tolerate sparse or
 * tenant-varying responses (verified live 2026-06-03 against
 * `simpler.jobsoid.com`).
 *
 * The list endpoint returns a flat array of `JobsoidJob` — each element is a
 * complete record (the HTML `description` is embedded inline), so no separate
 * detail call is required.
 */

/** Structured location block embedded in each job record. */
export interface JobsoidLocation {
  id?: number | null;
  /** Combined label (e.g. "Milan - Milan"). */
  title?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
}

/** Job function / category block (e.g. { title: "Business Development" }). */
export interface JobsoidFunction {
  id?: number | null;
  title?: string | null;
}

/** Department block (often null for single-department tenants). */
export interface JobsoidDepartment {
  id?: number | null;
  title?: string | null;
}

/**
 * A single job record as returned by `GET /api/v1/jobs` (array element) or
 * `GET /api/v1/jobs/{id}` (single object).
 */
export interface JobsoidJob {
  /** Numeric job id → `atsId` and used in the hosted / apply URLs. */
  id?: number | null;
  /** Short job reference code (e.g. "BD-IT"). */
  code?: string | null;
  /** Job title. */
  title?: string | null;
  /** Full HTML job description — the primary description source. */
  description?: string | null;
  /** Free-text industry label (e.g. "Computer Software"). */
  industry?: string | null;
  /** ISO-8601-ish publish timestamp (e.g. "2026-05-12T01:00:23.013"). */
  postedDate?: string | null;
  /** ISO-8601-ish closing timestamp, or null when open-ended. */
  closingDate?: string | null;
  /** Tenant-defined custom attributes (rarely populated). */
  attributes?: unknown[] | null;
  /** Structured location block. */
  location?: JobsoidLocation | null;
  /** Department block (often null). */
  department?: JobsoidDepartment | null;
  /** Division block(s) (rarely populated). */
  division?: unknown[] | null;
  /** Job function / category block. */
  function?: JobsoidFunction | null;
  /** Employment type label (e.g. "Full Time"); often empty. */
  type?: string | null;
  /** Number of open positions. */
  positions?: number | null;
  /** Experience label; often empty. */
  experience?: string | null;
  /** Salary label; often empty. */
  salary?: string | null;
  /** Canonical public job-detail page URL. */
  hostedUrl?: string | null;
  /** Public apply page URL. */
  applyUrl?: string | null;
  /** URL slug for the hosted page. */
  slug?: string | null;
  /** Employer / company display name. */
  company?: string | null;
}

/** The list endpoint returns a bare array of job records. */
export type JobsoidJobsResponse = JobsoidJob[];
