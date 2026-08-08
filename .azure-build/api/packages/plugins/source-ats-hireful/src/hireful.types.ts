/**
 * TypeScript interfaces for the Hireful (LiveVacancies) public careers surface.
 *
 * Hireful does not expose a single JSON list feed; the jobs index is a
 * client-rendered SPA. The adapter therefore enumerates a tenant's open roles
 * from its XML sitemap (`/sitemap.xml`) and parses each server-rendered detail
 * page (`/vacancy/{vacancyId}/{slug}`), reading the schema.org `JobPosting`
 * JSON-LD block embedded for Google-for-Jobs. The interfaces below model the
 * normalised, parsed shape the adapter extracts from those documents. Field
 * names mirror the schema.org wire meaning; a handful of aliases are modelled
 * defensively so minor cross-tenant or future-version markup drift never breaks
 * the parser.
 */

/** A single sitemap entry pointing at an open role's detail page. */
export interface HirefulSitemapEntry {
  /** Vacancy id parsed from `…/vacancy/{vacancyId}[/{slug}]`. Used as the ATS id. */
  vacancyId: string;
  /** Absolute detail-page URL (`https://{tenant}.livevacancies.co.uk/vacancy/…`). */
  url: string;
  /** ISO-ish `<lastmod>` value from the sitemap, when present. */
  lastmod?: string | null;
}

/** schema.org `PostalAddress` carried inside a `JobPosting.jobLocation`. */
export interface HirefulPostalAddress {
  /** City / town (e.g. "Birmingham"). */
  addressLocality?: string | null;
  /** County / region (e.g. "West Midlands"). */
  addressRegion?: string | null;
  /** Country code or name (e.g. "GB" / "United Kingdom"). */
  addressCountry?: string | { name?: string | null } | null;
}

/** schema.org `Place` carried inside a `JobPosting.jobLocation`. */
export interface HirefulJobLocation {
  address?: HirefulPostalAddress | null;
}

/** schema.org `Organization` carried inside a `JobPosting.hiringOrganization`. */
export interface HirefulHiringOrganization {
  name?: string | null;
}

/** schema.org `PropertyValue` carried inside a `JobPosting.identifier`. */
export interface HirefulIdentifier {
  value?: string | number | null;
}

/**
 * The schema.org `JobPosting` JSON-LD object embedded in a detail page. Only the
 * fields the adapter consumes are typed; everything is optional and defensively
 * narrowed at parse time, since the rendered payload varies by tenant.
 */
export interface HirefulJobPosting {
  '@type'?: string | string[] | null;
  title?: string | null;
  description?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType?: string | string[] | null;
  industry?: string | null;
  /** Free-text "remote OK" flag schema.org uses for home-working roles. */
  jobLocationType?: string | null;
  hiringOrganization?: HirefulHiringOrganization | string | null;
  jobLocation?: HirefulJobLocation | HirefulJobLocation[] | null;
  identifier?: HirefulIdentifier | string | number | null;
  /** Canonical / apply URL when the JSON-LD advertises one. */
  url?: string | null;
}

/**
 * Normalised view of a single Hireful role, assembled from its sitemap entry and
 * its parsed detail-page JSON-LD (with `og:` meta as fallbacks).
 */
export interface HirefulJob {
  /** Vacancy id — used as the ATS id. */
  vacancyId: string;

  /** Absolute public detail-page / apply URL. */
  url: string;
  /** Canonical URL from JSON-LD `url` / `og:url`, when present. */
  canonicalUrl?: string | null;

  /** Job display title (from JSON-LD `title` / `og:title` / `<title>`). */
  title?: string | null;

  /** Tenant company display name (from `hiringOrganization.name`). */
  companyName?: string | null;

  /** Full job-ad body as HTML (from JSON-LD `description`). */
  descriptionHtml?: string | null;
  /** Plain-text body fallback (from `og:description`) when no HTML body exists. */
  description?: string | null;

  /** Structured location parts parsed from `jobLocation.address`. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label (from JSON-LD `employmentType`). */
  employmentType?: string | null;

  /** Industry / department label (from JSON-LD `industry`), when present. */
  department?: string | null;

  /** Posted date — `datePosted` from JSON-LD, else the sitemap `<lastmod>`. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
