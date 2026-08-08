/**
 * TypeScript interfaces for the CareerPlug public careers surface.
 *
 * CareerPlug exposes no anonymous JSON feed; the structured data comes from the
 * `schema.org` `ItemList` of `JobPosting` objects embedded as
 * `application/ld+json` on the tenant's careers landing page and `/jobs` index.
 * Field names below mirror the schema.org vocabulary exactly. A handful of
 * loosely-typed unions are modelled defensively because schema.org permits a
 * field to be a single object or an array of objects, and minor cross-tenant
 * drift must never break the parser. All fields are optional / nullable.
 */

/** schema.org `Organization` (`hiringOrganization`) inside a JobPosting. */
export interface CareerPlugOrganization {
  '@type'?: string | null;
  /** Employer display name. */
  name?: string | null;
  /** Employer website (e.g. "https://www.careerplug.com"). */
  sameAs?: string | null;
  logo?: string | null;
}

/** schema.org `PostalAddress` inside a `Place` (`jobLocation`). */
export interface CareerPlugPostalAddress {
  '@type'?: string | null;
  streetAddress?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  postalCode?: string | null;
  /** ISO country code or full country name. */
  addressCountry?: string | null;
}

/** schema.org `Place` (`jobLocation`) inside a JobPosting. */
export interface CareerPlugPlace {
  '@type'?: string | null;
  address?: CareerPlugPostalAddress | null;
}

/**
 * schema.org `Country` / administrative-area object as used in
 * `applicationLocationRequirement` for remote-with-region roles, e.g.
 * `{ "@type": "Country", "name": "USA" }`.
 */
export interface CareerPlugLocationRequirement {
  '@type'?: string | null;
  /** Country / region name (e.g. "USA"). */
  name?: string | null;
}

/** schema.org `QuantitativeValue` inside a `MonetaryAmount.value`. */
export interface CareerPlugQuantitativeValue {
  '@type'?: string | null;
  /** Pay-interval token (e.g. "YEAR", "HOUR"). */
  unitText?: string | null;
  /** Numeric (string-encoded) pay value. */
  value?: string | number | null;
  minValue?: string | number | null;
  maxValue?: string | number | null;
}

/** schema.org `MonetaryAmount` (`baseSalary`) inside a JobPosting. */
export interface CareerPlugMonetaryAmount {
  '@type'?: string | null;
  /** ISO currency code (e.g. "USD"). */
  currency?: string | null;
  value?: CareerPlugQuantitativeValue | string | number | null;
}

/**
 * schema.org `JobPosting` object as embedded in the careers-page `ItemList`.
 * CareerPlug omits a per-item `url` / `identifier`, so the adapter pairs each
 * posting (by document order) with the page's job-card anchors to recover the
 * detail URL and numeric ATS id.
 */
export interface CareerPlugJobPostingLd {
  '@type'?: string | string[] | null;
  /** Role title. */
  title?: string | null;
  /** Full role description (HTML or newline-delimited plain text). */
  description?: string | null;
  /** ISO-8601 publish timestamp (e.g. "2025-06-02T12:34:07+00:00"). */
  datePosted?: string | null;
  /** ISO-8601 expiry timestamp, when present. */
  validThrough?: string | null;
  /** Employment-type enum key (e.g. "FULL_TIME", "PART_TIME", "CONTRACTOR"). */
  employmentType?: string | string[] | null;
  /** Whether the role supports direct apply on CareerPlug. */
  directApply?: boolean | null;
  /** Hiring organisation (employer display name + site). */
  hiringOrganization?: CareerPlugOrganization | null;
  /** Structured on-site location. May be a single Place or an array of Places. */
  jobLocation?: CareerPlugPlace | CareerPlugPlace[] | null;
  /** `"TELECOMMUTE"` flags a remote role. */
  jobLocationType?: string | null;
  /** Region requirement for remote roles (e.g. `{ name: "USA" }`). */
  applicationLocationRequirement?:
    | CareerPlugLocationRequirement
    | CareerPlugLocationRequirement[]
    | null;
  /** Compensation band (modelled for completeness; not mapped to JobPostDto). */
  baseSalary?: CareerPlugMonetaryAmount | null;
}

/** schema.org `ListItem` wrapper inside the careers-page `ItemList`. */
export interface CareerPlugListItem {
  '@type'?: string | null;
  /** 1-based position within the list. */
  position?: number | null;
  /** The wrapped JobPosting. */
  item?: CareerPlugJobPostingLd | null;
}

/** schema.org `ItemList` envelope embedded on the careers page. */
export interface CareerPlugItemList {
  '@context'?: string | null;
  '@type'?: string | null;
  /** Reported number of open roles. */
  numberOfItems?: number | null;
  /** The wrapped roles. */
  itemListElement?: CareerPlugListItem[] | null;
}

/**
 * A job-card anchor harvested from the careers-page HTML, used to recover the
 * per-role public URL and ATS id that the JSON-LD `JobPosting` omits.
 */
export interface CareerPlugJobAnchor {
  /** Numeric job id from a `/jobs/{id}` link, or short code from `/j/{code}`. */
  atsId?: string | null;
  /** Absolute public URL for the role (detail or short link). */
  jobUrl?: string | null;
}

/**
 * A merged job record: the structured JSON-LD `JobPosting` paired (by document
 * order) with the matching job-card anchor. Either side's URL/id may be absent;
 * mapping tolerates a missing anchor by deriving a deterministic ATS id.
 */
export interface CareerPlugJob {
  /** The structured posting; always present. */
  ld: CareerPlugJobPostingLd;
  /** The paired anchor (URL + id), when one was recoverable from the HTML. */
  anchor?: CareerPlugJobAnchor | null;
}
