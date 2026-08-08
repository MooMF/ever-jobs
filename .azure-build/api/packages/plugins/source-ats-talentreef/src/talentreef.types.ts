/**
 * TypeScript interfaces for the TalentReef public career-search surface.
 *
 * A tenant career page (`apply.jobappnetwork.com/{tenant}/{lang}`) is a
 * client-rendered SPA whose open roles are populated from (a) per-posting
 * schema.org `JobPosting` JSON-LD blocks and/or (b) an embedded positions array
 * hydrated by the SPA. Because the page is JS-rendered, the exact field set
 * drifts by tenant/version, so every field below is optional and a handful of
 * `camelCase` / `snake_case` aliases are modelled defensively so minor
 * cross-tenant or future-version drift never breaks the parser.
 */

/** A nested address object as it appears in schema.org `JobPosting` JSON-LD. */
export interface TalentReefAddress {
  '@type'?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  addressCountry?: string | TalentReefAddress | { name?: string | null } | null;
  streetAddress?: string | null;
  postalCode?: string | null;
  name?: string | null;
}

/** A `place`/`jobLocation` wrapper as it appears in schema.org JSON-LD. */
export interface TalentReefPlace {
  '@type'?: string | null;
  address?: TalentReefAddress | string | null;
}

/** A `hiringOrganization` object as it appears in schema.org JSON-LD. */
export interface TalentReefOrganization {
  '@type'?: string | null;
  name?: string | null;
  sameAs?: string | null;
}

/**
 * A single open position. Superset of the schema.org `JobPosting` JSON-LD shape
 * and the SPA's embedded positions item; all fields optional / defensive.
 */
export interface TalentReefJob {
  '@type'?: string | null;

  /** Stable internal position / requisition id — used as the ATS id. */
  id?: string | number | null;
  jobId?: string | number | null;
  job_id?: string | number | null;
  positionId?: string | number | null;
  requisitionId?: string | number | null;
  identifier?: string | number | { value?: string | number | null } | null;

  /** Job display title. */
  title?: string | null;
  name?: string | null;

  /** Absolute public apply / job-detail URL. */
  url?: string | null;
  link?: string | null;
  applyUrl?: string | null;
  apply_url?: string | null;
  /** Relative apply/detail path (anchored to the TalentReef host when present). */
  path?: string | null;
  slug?: string | null;

  /** Full job-ad body — HTML (JSON-LD `description`) and/or pre-stripped text. */
  description?: string | null;
  descriptionHtml?: string | null;
  description_html?: string | null;
  descriptionText?: string | null;
  description_text?: string | null;

  /** ISO-8601 timestamps. `datePosted` is the publish date (schema.org name). */
  datePosted?: string | null;
  datePublished?: string | null;
  date_posted?: string | null;
  postedDate?: string | null;
  updated?: string | null;
  validThrough?: string | null;

  /** schema.org structured location (`jobLocation.address`), or a flat string. */
  jobLocation?: TalentReefPlace | TalentReefPlace[] | null;
  location?: string | TalentReefAddress | null;
  /** Flat structured location parts (SPA item shape). */
  city?: string | null;
  state?: string | null;
  region?: string | null;
  country?: string | null;

  /** schema.org `employmentType` (e.g. `FULL_TIME`, `PART_TIME`) or free text. */
  employmentType?: string | string[] | null;
  employment_type?: string | null;

  /** Department / category / brand grouping labels. */
  department?: string | null;
  category?: string | null;
  jobCategory?: string | null;
  industry?: string | null;
  brand?: string | null;

  /** schema.org `hiringOrganization`, or a flat company-name string. */
  hiringOrganization?: TalentReefOrganization | string | null;
  company?: string | null;
  companyName?: string | null;

  /** schema.org remote hint (`jobLocationType: 'TELECOMMUTE'`) or SPA flag. */
  jobLocationType?: string | null;
  remote?: boolean | null;
  isRemote?: boolean | null;

  /** Free-text tag labels attached to the role (SPA item shape). */
  tags?: string[] | null;
}

/**
 * Embedded positions envelope hydrated by the SPA. Modelled defensively — the
 * adapter reads whichever of these array slots is populated.
 */
export interface TalentReefPositionsEnvelope {
  /** Tenant display name. */
  company?: string | null;
  companyName?: string | null;
  client?: { id?: string | number | null; name?: string | null } | null;
  /** Open roles for the tenant under any of the observed array keys. */
  jobs?: TalentReefJob[] | null;
  positions?: TalentReefJob[] | null;
  results?: TalentReefJob[] | null;
  items?: TalentReefJob[] | null;
}
