/**
 * TypeScript interfaces for the PageUp public careers surface.
 *
 * PageUp does not expose a single tenant-agnostic JSON list feed; the candidate
 * site is server-rendered. The adapter therefore enumerates a tenant's open roles
 * from its listing index (`/{instanceId}/caw/en/listing/`, parsing the real
 * `<a href="…/job/{jobId}/{slug}">` anchors) and parses each server-rendered
 * detail page (`/{instanceId}/caw/en/job/{jobId}/{slug}`), reading the
 * `<strong>`-labelled fields PageUp renders (with a schema.org `JobPosting`
 * JSON-LD block and `og:` meta as defensive fallbacks where a tenant exposes
 * them). The interfaces below model the normalised, parsed shape the adapter
 * extracts from those documents. A handful of aliases are modelled defensively so
 * minor cross-tenant or future-version markup drift never breaks the parser.
 */

/** A single listing-index entry pointing at an open role's detail page. */
export interface PageUpListingEntry {
  /** Numeric job id parsed from `…/job/{jobId}/{slug}`. Used as the ATS id. */
  jobId: string;
  /** Absolute detail-page URL (`https://careers.pageuppeople.com/…/job/…`). */
  url: string;
}

/** schema.org `PostalAddress` carried inside a `JobPosting.jobLocation`. */
export interface PageUpPostalAddress {
  /** City / town (e.g. "Newbury"). */
  addressLocality?: string | null;
  /** County / region / state (e.g. "Berkshire"). */
  addressRegion?: string | null;
  /** Country code or name (e.g. "GB" / "United Kingdom"). */
  addressCountry?: string | { name?: string | null } | null;
}

/** schema.org `Place` carried inside a `JobPosting.jobLocation`. */
export interface PageUpJobLocation {
  address?: PageUpPostalAddress | null;
}

/** schema.org `Organization` carried inside a `JobPosting.hiringOrganization`. */
export interface PageUpHiringOrganization {
  name?: string | null;
}

/** schema.org `PropertyValue` carried inside a `JobPosting.identifier`. */
export interface PageUpIdentifier {
  value?: string | number | null;
}

/**
 * The schema.org `JobPosting` JSON-LD object some PageUp tenants embed for
 * Google-for-Jobs. Only the fields the adapter consumes are typed; everything is
 * optional and defensively narrowed at parse time, since the rendered payload
 * varies by tenant and is not present on every site.
 */
export interface PageUpJobPosting {
  '@type'?: string | string[] | null;
  title?: string | null;
  description?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType?: string | string[] | null;
  industry?: string | null;
  /** Free-text "remote OK" flag schema.org uses for home-working roles. */
  jobLocationType?: string | null;
  hiringOrganization?: PageUpHiringOrganization | string | null;
  jobLocation?: PageUpJobLocation | PageUpJobLocation[] | null;
  identifier?: PageUpIdentifier | string | number | null;
  /** Canonical / apply URL when the JSON-LD advertises one. */
  url?: string | null;
}

/**
 * Normalised view of a single PageUp role, assembled from its listing entry and
 * its parsed detail page (`<strong>`-labelled fields, with JSON-LD / `og:` meta as
 * fallbacks).
 */
export interface PageUpJob {
  /** Numeric job id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail-page / apply URL. */
  url: string;
  /** Canonical URL from JSON-LD `url` / `og:url`, when present. */
  canonicalUrl?: string | null;

  /** Job display title (from `<h1>` / JSON-LD `title` / `og:title` / `<title>`). */
  title?: string | null;

  /** Tenant company display name (from `hiringOrganization.name` / instance). */
  companyName?: string | null;

  /** Full job-ad body as HTML (from JSON-LD `description`), when present. */
  descriptionHtml?: string | null;
  /** Plain-text body fallback (from `og:description`) when no HTML body exists. */
  description?: string | null;

  /** Structured location parts (from `<strong>Location:</strong>` / JSON-LD). */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label (from `<strong>Work type:</strong>` / JSON-LD). */
  employmentType?: string | null;

  /** Category / department label (from `<strong>Categories:</strong>` / JSON-LD). */
  department?: string | null;

  /** Posted date — `<strong>Advertised:</strong>` / JSON-LD `datePosted`. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
