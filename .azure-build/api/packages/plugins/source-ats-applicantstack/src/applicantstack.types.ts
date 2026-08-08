/**
 * TypeScript interfaces for the ApplicantStack public job-board surface.
 *
 * ApplicantStack does not expose a JSON list feed; the openings index is a
 * server-rendered HTML `<table>` and each role has a server-rendered detail
 * page. The adapter enumerates a tenant's open roles from the openings table
 * (`/x/openings`) and, for each role it surfaces, enriches it from the detail
 * page (`/x/detail/{jobId}`). The interfaces below model the normalised, parsed
 * shape extracted from those documents. Field names mirror the wire meaning; a
 * couple of optional fields are modelled defensively so minor cross-tenant or
 * future-version markup drift never breaks the parser.
 */

/** A single open-role row parsed from the openings table. */
export interface ApplicantStackOpening {
  /** Opaque alphanumeric job id from `…/x/detail/{jobId}` — used as the ATS id. */
  jobId: string;
  /** Absolute detail-page URL (`https://{tenant}.applicantstack.com/x/detail/{jobId}`). */
  url: string;
  /** Job display title (the detail anchor's link text). */
  title: string;
  /** Posted date as shown in the table (`MM/DD/YYYY`), when present. */
  datePosted?: string | null;
  /** "Industry - Job Category" column value, when present. */
  category?: string | null;
  /** City column value, when present. */
  city?: string | null;
}

/**
 * Extra fields harvested from a role's server-rendered detail page to enrich the
 * openings-table row. Every field is optional — a detail fetch that fails or
 * yields nothing simply leaves the row's table-derived values in place.
 */
export interface ApplicantStackDetail {
  /** Tenant company display name (from `og:site_name` / `<title>` tail). */
  company?: string | null;
  /** Full job-ad body as HTML (from `<div class="listing_description">`). */
  descriptionHtml?: string | null;
  /** Plain-text body fallback (from `og:description`) when no HTML body is present. */
  descriptionText?: string | null;
  /** Posted date from the detail "Job post summary" table (`MM/DD/YYYY`). */
  datePosted?: string | null;
  /** "Industry - Job Category" from the detail summary table. */
  category?: string | null;
  /** City from the detail summary table. */
  city?: string | null;
  /** Human-visible ID field from the detail summary table (e.g. `56380612782CBH`). */
  referenceId?: string | null;
}

/**
 * Normalised view of a single ApplicantStack role, assembled from its openings
 * table row and (optionally) its parsed detail page.
 */
export interface ApplicantStackJob {
  /** Opaque alphanumeric job id — used as the ATS id. */
  jobId: string;
  /** Absolute public detail-page URL. */
  url: string;
  /** Absolute public apply-form URL (`…/x/apply/{jobId}`). */
  applyUrl: string;
  /** Job display title. */
  title: string;
  /** Tenant company display name. */
  companyName: string;
  /** Full job-ad body — HTML when available, else the plain-text `og:description`. */
  descriptionHtml?: string | null;
  descriptionText?: string | null;
  /** City (from the table or the detail summary). */
  city?: string | null;
  /** "Industry - Job Category" label (used to derive a department). */
  category?: string | null;
  /** Posted date — `MM/DD/YYYY` normalised downstream to `YYYY-MM-DD`. */
  datePosted?: string | null;
}
