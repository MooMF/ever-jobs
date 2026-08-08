/**
 * TypeScript interfaces for the VivaHR public careers pages.
 *
 * VivaHR exposes no anonymous JSON API; each job-detail page embeds a
 * schema.org `JobPosting` object inside a `<script type="application/ld+json">`
 * tag. Field names below mirror that real wire shape (schema.org camelCase /
 * PascalCase `@type` markers). All fields are modelled defensively as optional
 * because individual tenants may omit `baseSalary`, `jobLocationType`, etc.
 */

/** schema.org `PostalAddress` nested under `JobPosting.jobLocation`. */
export interface VivaHRPostalAddress {
  '@type'?: string;
  /** City name (e.g. "Gilbert"). */
  addressLocality?: string | null;
  /** State / region (e.g. "Arizona"). */
  addressRegion?: string | null;
  addressCountry?: string | null;
  postalCode?: string | null;
  streetAddress?: string | null;
}

/** schema.org `Place` — the `jobLocation` value. */
export interface VivaHRPlace {
  '@type'?: string;
  address?: VivaHRPostalAddress | null;
  geo?: { '@type'?: string; latitude?: string | number | null; longitude?: string | number | null } | null;
}

/** schema.org `Organization` — the `hiringOrganization` value. */
export interface VivaHROrganization {
  '@type'?: string;
  /** Tenant display name (e.g. "AvaHR"). */
  name?: string | null;
  /** Canonical company website (e.g. "https://avahr.com"). */
  sameAs?: string | null;
  logo?: string | null;
}

/** schema.org `PropertyValue` — the `identifier` value; `value` is the job id. */
export interface VivaHRIdentifier {
  '@type'?: string;
  name?: string | null;
  /** Stable per-job id (e.g. "79122") — used as the ATS id. */
  value?: string | number | null;
}

/** schema.org `QuantitativeValue` nested under `baseSalary.value`. */
export interface VivaHRQuantitativeValue {
  '@type'?: string;
  minValue?: string | number | null;
  maxValue?: string | number | null;
  value?: string | number | null;
  unitText?: string | null;
}

/** schema.org `MonetaryAmount` — the `baseSalary` value. */
export interface VivaHRMonetaryAmount {
  '@type'?: string;
  currency?: string | null;
  value?: VivaHRQuantitativeValue | null;
}

/**
 * A single open position as embedded in a job-detail page's JSON-LD
 * (`@type: "JobPosting"`). Defensive lower-case aliases are modelled for the
 * couple of fields whose casing has been observed to drift across tenants.
 */
export interface VivaHRJobPosting {
  '@context'?: string;
  '@type'?: string;

  /** Canonical absolute detail-page URL (also our `jobUrl`). */
  url?: string | null;

  /** Role title. */
  title?: string | null;

  /** Whether the role accepts applications directly on the careers page. */
  directApply?: boolean | null;

  /** HTML job description. */
  description?: string | null;

  /** ISO date the role was posted (e.g. "2026-03-27"). */
  datePosted?: string | number | null;
  /** ISO date the posting closes. */
  validThrough?: string | number | null;

  /** schema.org employment type token (e.g. "FULL_TIME"). */
  employmentType?: string | null;

  /** Free-text industry label (e.g. "Information Technology & Services"). */
  industry?: string | null;

  /** Stable per-job id wrapper. */
  identifier?: VivaHRIdentifier | string | number | null;

  /** Hiring organization (tenant) metadata. */
  hiringOrganization?: VivaHROrganization | null;

  /** Salary range, when published. */
  baseSalary?: VivaHRMonetaryAmount | null;

  /** "TELECOMMUTE" marks a fully-remote role. */
  jobLocationType?: string | null;
  jobLocationtype?: string | null;

  /** Primary work location. */
  jobLocation?: VivaHRPlace | VivaHRPlace[] | null;

  /** Country/region applicant restriction (unused in mapping). */
  applicantLocationRequirements?: { '@type'?: string; name?: string | null } | null;
}
