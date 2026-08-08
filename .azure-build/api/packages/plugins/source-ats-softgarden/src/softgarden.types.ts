/**
 * TypeScript interfaces for the Softgarden public career-page JSON feed.
 *
 * The feed at `GET {tenantOrigin}/jobs.feed.json` is a schema.org `DataFeed`
 * whose `dataFeedElement[]` entries each wrap a `JobPosting` `item`. Field
 * names mirror the real wire shape (schema.org JSON-LD). All fields are
 * optional/nullable to tolerate sparse or tenant-varying responses.
 */

/** schema.org `PostalAddress` embedded in a job's `jobLocation`. */
export interface SoftgardenPostalAddress {
  '@type'?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  postalCode?: string | null;
  addressCountry?: string | null;
  streetAddress?: string | null;
}

/** schema.org `Place` — the `jobLocation` of a posting. */
export interface SoftgardenPlace {
  '@type'?: string | null;
  address?: SoftgardenPostalAddress | null;
}

/** schema.org `PropertyValue` — the posting's stable identifier. */
export interface SoftgardenIdentifier {
  '@type'?: string | null;
  /** Hiring organisation name (mirror of `hiringOrganization.name`). */
  name?: string | null;
  /** Numeric ATS job id — also the first path segment of `item.url`. */
  value?: number | string | null;
}

/** schema.org `Organization` — the hiring organisation. */
export interface SoftgardenOrganization {
  '@type'?: string | null;
  '@id'?: string | null;
  name?: string | null;
  url?: string | null;
  logo?: string | null;
  industry?: string | null;
  sameAs?: string | null;
}

/** schema.org `JobPosting` — the `item` of a `dataFeedElement` entry. */
export interface SoftgardenJobPosting {
  '@type'?: string | null;
  /** Public job title. */
  title?: string | null;
  /** Canonical, anonymous public job-detail page URL. */
  url?: string | null;
  /** ISO-8601 publish timestamp (e.g. "2026-05-22T15:33:44.933+02:00"). */
  datePosted?: string | null;
  /** ISO-8601 expiry timestamp, when present. */
  validThrough?: string | null;
  /** Stable numeric identifier wrapper. */
  identifier?: SoftgardenIdentifier | null;
  /** Inline HTML job description — the primary description source. */
  description?: string | null;
  /** schema.org employment-type token (FULL_TIME, PART_TIME, INTERN, ...). */
  employmentType?: string | string[] | null;
  /** schema.org remote token (e.g. "TELECOMMUTE"), when present. */
  jobLocationType?: string | null;
  /** Hiring organisation metadata. */
  hiringOrganization?: SoftgardenOrganization | null;
  /** Structured job location. */
  jobLocation?: SoftgardenPlace | SoftgardenPlace[] | null;
}

/** A single `dataFeedElement` wrapper entry. */
export interface SoftgardenFeedElement {
  '@type'?: string | null;
  dateModified?: string | null;
  item?: SoftgardenJobPosting | null;
}

/** Top-level response from `GET {tenantOrigin}/jobs.feed.json`. */
export interface SoftgardenFeedResponse {
  meta?: Record<string, unknown> | null;
  '@context'?: string | null;
  '@type'?: string | null;
  name?: string | null;
  dateModified?: string | null;
  numberOfItems?: number | null;
  dataFeedElement?: SoftgardenFeedElement[] | null;
}
