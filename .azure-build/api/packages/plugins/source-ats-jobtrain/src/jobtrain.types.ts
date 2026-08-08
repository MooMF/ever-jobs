/**
 * TypeScript interfaces for the Jobtrain public career-site surface.
 *
 * Jobtrain does not expose a single JSON list feed; the listing page is
 * client-rendered. The adapter therefore enumerates a tenant's live roles from
 * its `_JobCard` HTML partial and parses each server-rendered detail page's
 * schema.org `JobPosting` JSON-LD block. The interfaces below model the
 * structured shape parsed from those documents. Field names mirror the
 * schema.org `JobPosting` wire shape; every field is optional and read
 * defensively so minor cross-tenant or future-version markup drift never breaks
 * the parser.
 */

/** A schema.org `PostalAddress` from a `JobPosting.jobLocation.address`. */
export interface JobtrainPostalAddress {
  '@type'?: string;
  /** City / town (e.g. "Motherwell"). */
  addressLocality?: string | null;
  /** Region / county (e.g. "North Lanarkshire"). */
  addressRegion?: string | null;
  /** Postcode (e.g. "ML1 1JJ"). */
  postalCode?: string | null;
  /** ISO country code or name (e.g. "GB"). */
  addressCountry?: string | null;
}

/** A schema.org `Place` from a `JobPosting.jobLocation`. */
export interface JobtrainPlace {
  '@type'?: string;
  address?: JobtrainPostalAddress | null;
}

/** A schema.org `Organization` from a `JobPosting.hiringOrganization`. */
export interface JobtrainOrganization {
  '@type'?: string;
  /** Tenant company display name (e.g. "CrossReach"). */
  name?: string | null;
  sameAs?: string | null;
  logo?: string | null;
}

/**
 * The schema.org `JobPosting` object parsed from a detail page's JSON-LD block.
 * Each field mirrors the schema.org property of the same name.
 */
export interface JobtrainJobPosting {
  '@context'?: string;
  '@type'?: string;
  /** Job display title (e.g. "Support Worker - Part Time (Term time only)"). */
  title?: string | null;
  /** Posted date, typically `YYYY-MM-DD` (e.g. "2026-05-28"). */
  datePosted?: string | null;
  /** Closing date, typically an ISO timestamp (e.g. "2026-06-14T00:00"). */
  validThrough?: string | null;
  /** Free-text salary band (e.g. "£13.65/hour - £14.03/hour (CRB18)"). */
  baseSalary?: string | null;
  /** Employment-type label (e.g. "Term Time", "Permanent", "Full Time"). */
  employmentType?: string | null;
  /** Education requirement label (e.g. "Not Specified"). */
  educationRequirements?: string | null;
  /** Full job-ad body as HTML. */
  description?: string | null;
  /** Structured location. */
  jobLocation?: JobtrainPlace | null;
  /** Tenant company / employer. */
  hiringOrganization?: JobtrainOrganization | null;
  /** Canonical detail / apply URL (carries a `&Source=…` tracking suffix). */
  url?: string | null;
}

/**
 * Normalised view of a single Jobtrain role, assembled from its `_JobCard`
 * entry and its parsed detail-page `JobPosting`.
 */
export interface JobtrainJob {
  /** Numeric job id parsed from the card — used as the ATS id. */
  jobId: string;
  /** Absolute public detail-page / apply URL we fetched. */
  url: string;
  /** The schema.org `JobPosting` parsed from the detail page, when present. */
  posting?: JobtrainJobPosting | null;
}
