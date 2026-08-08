/**
 * TypeScript interfaces for the Varbi public career surface.
 *
 * Varbi does not expose a documented public JSON feed; the open-roles list is a
 * server-rendered HTML table on the tenant career page
 * (`GET https://{tenant}.varbi.com/en/`) and each role has an HTML job-ad page
 * (`GET …/what:job/jobID:{jobID}/`). These interfaces model the *parsed* shape
 * the adapter materialises from that HTML, mirroring the real on-page fields.
 *
 * Field names follow the on-page `snake_case` / cell semantics where one
 * exists; a few `camelCase` aliases are modelled defensively so future markup
 * drift never hard-breaks the parser.
 */

/** A single open role parsed from one Varbi listing-table row (`<tr>`). */
export interface VarbiJob {
  /** Numeric Varbi vacancy id (the `jobID:` segment) — used as the ATS id. */
  job_id?: string | null;
  jobId?: string | null;

  /** Job display title (title cell, `pos-title`). */
  title?: string | null;
  name?: string | null;

  /** Absolute public job-ad URL (`…/what:job/jobID:{jobID}/`). */
  job_url?: string | null;
  jobUrl?: string | null;

  /** Absolute public apply URL (`…/apply/positionquick/{jobID}/`). */
  apply_url?: string | null;
  applyUrl?: string | null;

  /** Free-text town / city (town cell, `pos-town`). */
  town?: string | null;
  city?: string | null;

  /** Company / department blob (sub-company cell, `pos-subcompany`). */
  subcompany?: string | null;
  department?: string | null;

  /** Application deadline as `YYYY-MM-DD` (ends cell, `pos-ends`). */
  application_deadline?: string | null;
  applicationDeadline?: string | null;

  /** Full job-ad body HTML (detail page, `<div class="job-desc">`). */
  description_html?: string | null;
  descriptionHtml?: string | null;

  /** Plain-text advert summary harvested from `og:description` (detail page). */
  description_text?: string | null;
  descriptionText?: string | null;

  /** Employment-type label, when surfaced on the ad (free text). */
  employment_type?: string | null;
  employmentType?: string | null;
}

/**
 * The materialised result of parsing a tenant career page: the tenant display
 * name (from the page `<title>`) plus the parsed open-role rows.
 */
export interface VarbiListing {
  /** Tenant display / company name derived from the page `<title>`. */
  company?: string | null;
  /** Open roles for the tenant, one per listing-table row. */
  jobs: VarbiJob[];
}
