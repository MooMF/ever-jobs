/**
 * TypeScript interfaces for the HR-ON Recruit public career surface.
 *
 * HR-ON does not expose a documented anonymous JSON feed — the public surface
 * is server-rendered HTML — so these interfaces model the *internal* shapes the
 * adapter materialises while scraping:
 *
 *   - {@link HrOnListingItem} — one open role harvested from the tenant's
 *     career page (the numeric job id + its absolute detail URL, plus any
 *     title / location text co-located with the link in the listing).
 *   - {@link HrOnJobDetail} — the fields extracted from a job-detail HTML page.
 *   - {@link HrOnJobPostingLd} — the optional schema.org `JobPosting` JSON-LD
 *     block (defensively parsed when a tenant's theme injects one for Google
 *     for Jobs); both `snake_case`/`camelCase` drift and array/`@graph`
 *     wrappers are tolerated by the parser.
 *
 * A handful of fields are modelled defensively so minor cross-tenant markup
 * drift never breaks the mapper.
 */

/** A single open role harvested from a tenant's HR-ON career page. */
export interface HrOnListingItem {
  /** Numeric HR-ON job id (the ATS id) parsed from the `?jobid=` link. */
  jobId: string;

  /** Absolute URL of the job-detail page. */
  detailUrl: string;

  /** Job title text co-located with the listing link, if any. */
  title?: string | null;

  /** Free-text location text co-located with the listing link, if any. */
  location?: string | null;
}

/** Fields extracted from a single HR-ON job-detail HTML page. */
export interface HrOnJobDetail {
  /** Job title (from JSON-LD, the page <h1>/<h2>, or <title>). */
  title?: string | null;

  /** Hiring company / tenant display name, if discoverable on the page. */
  companyName?: string | null;

  /** Free-text work-location string (e.g. "Odense C, Copenhagen V"). */
  location?: string | null;

  /** Structured city, when JSON-LD supplies it. */
  city?: string | null;
  /** Structured region/state, when JSON-LD supplies it. */
  state?: string | null;
  /** Structured country, when JSON-LD supplies it. */
  country?: string | null;

  /** ISO-8601 publish date (`YYYY-MM-DD`), when present. */
  datePosted?: string | null;

  /** schema.org employmentType token (e.g. "FULL_TIME"), when present. */
  employmentType?: string | null;

  /** Whether the role is flagged remote/telecommute. */
  isRemote?: boolean | null;

  /** Full job-ad body HTML used for the description. */
  descriptionHtml?: string | null;
}

/** A schema.org PostalAddress, as embedded in JobPosting JSON-LD. */
export interface HrOnPostalAddress {
  '@type'?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  addressCountry?: string | { name?: string | null } | null;
  postalCode?: string | null;
}

/** A schema.org Place, as embedded in JobPosting JSON-LD. */
export interface HrOnPlace {
  '@type'?: string | null;
  address?: HrOnPostalAddress | null;
}

/** A schema.org Organization, as embedded in JobPosting JSON-LD. */
export interface HrOnOrganization {
  '@type'?: string | null;
  name?: string | null;
}

/**
 * A schema.org `JobPosting`, optionally embedded by a tenant theme for Google
 * for Jobs. Every field is optional — the HTML page is the primary source and
 * the JSON-LD is a best-effort enrichment.
 */
export interface HrOnJobPostingLd {
  '@type'?: string | string[] | null;
  title?: string | null;
  description?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType?: string | string[] | null;
  jobLocationType?: string | null;
  hiringOrganization?: HrOnOrganization | null;
  jobLocation?: HrOnPlace | HrOnPlace[] | null;
  identifier?:
    | { '@type'?: string | null; name?: string | null; value?: string | number | null }
    | string
    | number
    | null;
}
