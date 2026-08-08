/**
 * TypeScript interfaces for Workstream public careers HTML data.
 *
 * Workstream serves its public careers pages as server-rendered HTML at
 * `https://www.workstream.us/j/{accountId}/{brandSlug}`. There is no public
 * anonymous JSON API — all data is extracted by parsing HTML responses.
 *
 * `WorkstreamListJob` captures the minimal data available from the positions
 * listing page (job title, URL, location slug, job id).  `WorkstreamDetailJob`
 * adds the richer data hydrated from the individual job detail page.
 */

/**
 * Minimal job data extracted from the positions listing HTML.
 * The listing page provides href links whose path encodes the location slug,
 * job slug, and job id.
 */
export interface WorkstreamListJob {
  /** The full absolute URL of the job detail page. */
  jobUrl: string;

  /** 8-character hex job identifier extracted from the job URL path. Acts as atsId. */
  jobId: string;

  /** Location slug segment from the URL, e.g. `san-jose-5497`. */
  locationSlug: string;

  /** Job title slug segment from the URL, e.g. `general-manager`. */
  jobSlug: string;
}

/**
 * Rich job data extracted from the individual job detail HTML page.
 * All fields are optional — missing elements gracefully fall back to null.
 */
export interface WorkstreamDetailJob {
  /** Job title extracted from the page heading. */
  title?: string | null;

  /** Employer / brand name extracted from the page. */
  companyName?: string | null;

  /** Full street address, e.g. "1030 El Paseo de Saratoga, San Jose, CA 95130". */
  addressRaw?: string | null;

  /** City, e.g. "San Jose". */
  city?: string | null;

  /** State/province code or name, e.g. "CA". */
  state?: string | null;

  /** ZIP or postal code, e.g. "95130". */
  postalCode?: string | null;

  /** Country, e.g. "US". */
  country?: string | null;

  /** Employment type, e.g. "Full-time", "Part-time". */
  employmentType?: string | null;

  /** Pay / compensation string as shown on the page, e.g. "$17.13 - 20.00 per hour". */
  payRaw?: string | null;

  /** Full job description HTML or plain text as found in the page body. */
  description?: string | null;

  /** Canonical apply URL (the `/apply` sub-path of the job detail URL). */
  applyUrl?: string | null;

  /** Whether the role is marked as remote (detected from title or description). */
  isRemote?: boolean;
}
