/**
 * TypeScript interfaces for the Prescreen (onlyfy.jobs) public career portal.
 *
 * The candidate portal is server-rendered HTML; there is no anonymous JSON API.
 * These interfaces model the values extracted from the HTML with cheerio:
 *   - {@link PrescreenListingItem}: parsed from a `#jobList` row on the landing page.
 *   - {@link PrescreenJobPostingLd}: parsed from the `schema.org` `JobPosting`
 *     JSON-LD block on a `/job/{token}` detail page.
 *   - {@link PrescreenJob}: the merged record handed to the DTO mapper.
 *
 * All fields are optional/nullable to tolerate sparse rows, missing JSON-LD,
 * or tenant-varying markup.
 */

/** A single job row parsed from the `#jobList` container on the portal landing page. */
export interface PrescreenListingItem {
  /** Opaque 32-char job slug from the row's `/job/{token}` anchor href. */
  token?: string | null;
  /** Job title text from the row anchor. */
  title?: string | null;
  /** Free-text location label from the row's location cell (e.g. "Graz", "München"). */
  location?: string | null;
  /** Absolute detail-page URL (`https://{handle}.onlyfy.jobs/job/{token}`). */
  detailUrl?: string | null;
}

/** A `schema.org` PostalAddress as embedded in the JobPosting JSON-LD. */
export interface PrescreenPostalAddress {
  '@type'?: string | null;
  /** City / locality (e.g. "Graz"). */
  addressLocality?: string | null;
  /** Region / state (often absent for AT/DE portals). */
  addressRegion?: string | null;
  /** Country name (e.g. "Austria"). */
  addressCountry?: string | null;
  /** Postal code (e.g. "8010"). */
  postalCode?: string | null;
}

/** A `schema.org` Place as embedded in the JobPosting JSON-LD. */
export interface PrescreenPlace {
  '@type'?: string | null;
  address?: PrescreenPostalAddress | null;
}

/** A `schema.org` Organization as embedded in the JobPosting JSON-LD. */
export interface PrescreenOrganization {
  '@type'?: string | null;
  /** Employer name (e.g. "Virtual Vehicle Research GmbH"). */
  name?: string | null;
  /** Employer website. */
  sameAs?: string | null;
  /** Employer logo URL. */
  logo?: string | null;
}

/** A `schema.org` PropertyValue used for the JobPosting `identifier`. */
export interface PrescreenIdentifier {
  '@type'?: string | null;
  name?: string | null;
  /** Stable short job id (e.g. "wmo5fb98") — preferred as the ATS id. */
  value?: string | null;
}

/**
 * The `schema.org` JobPosting JSON-LD block embedded on a `/job/{token}` detail
 * page. Field names mirror the JSON-LD wire shape exactly.
 */
export interface PrescreenJobPostingLd {
  '@context'?: string | null;
  '@type'?: string | null;
  /** Job title. */
  title?: string | null;
  /**
   * Truncated (~200-char) description summary. The full body is fetched
   * separately from the `/job/show/{token}/full` fragment.
   */
  description?: string | null;
  /** Publish date in `YYYY-MM-DD` format (e.g. "2026-04-30"). */
  datePosted?: string | null;
  /** Expiry date in `YYYY-MM-DD` format. */
  validThrough?: string | null;
  /** Employment type label (e.g. "Part-time / full-time"). */
  employmentType?: string | null;
  /** `"TELECOMMUTE"` indicates a remote role. */
  jobLocationType?: string | null;
  hiringOrganization?: PrescreenOrganization | null;
  /** May be a single Place or an array of Places. */
  jobLocation?: PrescreenPlace | PrescreenPlace[] | null;
  identifier?: PrescreenIdentifier | null;
  /** Salary block — not parsed into structured output. */
  baseSalary?: unknown;
}

/**
 * The merged job record handed to the DTO mapper: listing data overlaid with
 * the JSON-LD structured fields and the full-description HTML.
 */
export interface PrescreenJob {
  /** Stable ATS id — JSON-LD `identifier.value` when present, else the URL token. */
  atsId?: string | null;
  /** Opaque URL token (always present from the listing). */
  token?: string | null;
  /** Resolved job title. */
  title?: string | null;
  /** Full job-ad HTML body (from the `/job/show/{token}/full` fragment). */
  descriptionHtml?: string | null;
  /** Free-text location label from the listing row (fallback). */
  listingLocation?: string | null;
  /** Structured JobPosting JSON-LD (may be null when the page lacks it). */
  ld?: PrescreenJobPostingLd | null;
  /** Absolute detail-page URL. */
  detailUrl?: string | null;
}
