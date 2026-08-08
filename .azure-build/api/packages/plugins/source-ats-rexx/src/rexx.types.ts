/**
 * TypeScript interfaces for the rexx systems public career-portal surface.
 *
 * Two surfaces contribute to a full job record:
 *   - The listing page (`GET /stellenangebote.html`) yields lightweight
 *     {@link RexxListingItem} rows parsed from `<article.joboffer_container>`
 *     cards (title, detail URL, locality, work mode, career level).
 *   - The detail page (`GET /{slug}-de-j{id}.html`) embeds a schema.org
 *     `JobPosting` JSON-LD object, modelled by {@link RexxJobPostingLd}, which
 *     carries the rich, stable fields (description HTML, dates, employment
 *     type, structured address, hiring organisation).
 *
 * All fields are optional/nullable to tolerate sparse or tenant-varying
 * responses.
 */

/** A job-listing row parsed from one `<article.joboffer_container>` card. */
export interface RexxListingItem {
  /** Numeric job id extracted from the detail-page URL (`-de-j{id}.html`). */
  jobId?: string | null;
  /** Job title text from the card title anchor. */
  title?: string | null;
  /** Absolute canonical detail-page URL. */
  detailUrl?: string | null;
  /** Location locality label (e.g. "Eschach"). */
  location?: string | null;
  /** Work-mode label (e.g. "Präsenz / Mobil", "Homeoffice / Mobil"). */
  workMode?: string | null;
  /** Career-level chip (e.g. "mit Berufserfahrung", "Ausbildung"). */
  careerLevel?: string | null;
}

/** schema.org PostalAddress as embedded in the JobPosting JSON-LD. */
export interface RexxPostalAddress {
  '@type'?: string | null;
  streetAddress?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  postalCode?: string | null;
  /** ISO country code (e.g. "DE") or full country name. */
  addressCountry?: string | null;
}

/** schema.org Place (`jobLocation`) as embedded in the JobPosting JSON-LD. */
export interface RexxPlace {
  '@type'?: string | null;
  address?: RexxPostalAddress | null;
}

/** schema.org Organization (`hiringOrganization`) in the JobPosting JSON-LD. */
export interface RexxOrganization {
  '@type'?: string | null;
  name?: string | null;
  sameAs?: string | null;
  logo?: string | null;
}

/**
 * schema.org `JobPosting` object embedded as `application/ld+json` on every
 * rexx detail page. Field names mirror the schema.org vocabulary exactly.
 */
export interface RexxJobPostingLd {
  '@context'?: string | null;
  '@type'?: string | null;
  /** Job title. */
  title?: string | null;
  /** ISO-8601 date the posting was published (e.g. "2026-04-30"). */
  datePosted?: string | null;
  /** ISO-8601 date the posting expires. */
  validThrough?: string | null;
  /** e.g. "FULL_TIME", "PART_TIME", "INTERN", "CONTRACTOR". */
  employmentType?: string | string[] | null;
  /** Whether the posting supports direct apply. */
  directApply?: boolean | null;
  /** HTML company / role introduction. */
  description?: string | null;
  /** HTML list of responsibilities / tasks. */
  responsibilities?: string | null;
  /** HTML list of required qualifications. */
  qualifications?: string | null;
  /** HTML list of benefits. */
  jobBenefits?: string | null;
  /** Hiring organisation (employer display name + logo). */
  hiringOrganization?: RexxOrganization | null;
  /** Structured job location (PostalAddress). May also be an array of Places. */
  jobLocation?: RexxPlace | RexxPlace[] | null;
}

/**
 * A merged job record combining the listing row with the detail-page
 * JSON-LD. Either side may be absent; mapping tolerates a missing detail.
 */
export interface RexxJob extends RexxListingItem {
  ld?: RexxJobPostingLd | null;
}
