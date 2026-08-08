/**
 * TypeScript interfaces for the ClearCompany public careers jobs API.
 *
 * The feed (`GET /api/v1/careers/jobs`, tenant via the `API-ShortName` header)
 * returns a flat array of job objects. Field names mirror the real wire shape,
 * which is PascalCase. Optional `snake_case`/`camelCase` aliases are modelled
 * defensively so minor cross-tenant drift never breaks the parser.
 */

/** A single open position as returned by `/api/v1/careers/jobs`. */
export interface ClearCompanyJob {
  /** Stable job GUID — used as the ATS id and the job-detail URL segment. */
  Id?: string | null;
  id?: string | null;

  /** Tenant / organization display name (e.g. "ClearCompany-1132"). */
  OrganizationName?: string | null;
  OrganizationId?: number | string | null;

  /** Structured department / office identifiers + display names. */
  DepartmentId?: string | null;
  DepartmentName?: string | null;
  OfficeId?: string | null;
  /** Free-text office/location label (e.g. "Copley Square, Boston"). */
  OfficeName?: string | null;

  /** Recruiter metadata (unused in mapping, modelled for completeness). */
  RecruiterUserId?: string | null;
  RecruiterName?: string | null;

  /** Primary title field; lower-case aliases are defensive fallbacks. */
  PositionTitle?: string | null;
  positionTitle?: string | null;
  Title?: string | null;
  title?: string | null;

  /** HTML job description. */
  Description?: string | null;
  description?: string | null;

  /** ISO-8601 open/posted date (e.g. "2013-08-10T04:00:00Z"). */
  OpenDate?: string | number | null;
  openDate?: string | number | null;

  /** Per-job apply URL (e.g. "https://{slug}.clearcompany.com/careers/jobs/{id}/apply"). */
  ApplyUrl?: string | null;
  applyUrl?: string | null;
  /** Optional referral URL. */
  ReferUrl?: string | null;

  /** Self-scheduling flag (unused in mapping). */
  HasSelfScheduling?: boolean | null;
}

/** The feed responds with a bare array; this alias documents that envelope. */
export type ClearCompanyJobsResponse = ClearCompanyJob[];
