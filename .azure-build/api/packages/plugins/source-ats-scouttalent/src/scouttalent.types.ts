/**
 * TypeScript interfaces for the Scout Talent (applynow.net.au) public careers
 * surface.
 *
 * Scout Talent does not expose a single JSON list feed; each tenant publishes a
 * server-rendered HTML careers board on `https://{tenant}.applynow.net.au/`. The
 * adapter therefore enumerates a tenant's open roles from the index HTML (the
 * `/jobs/{code}-{slug}` anchors) and parses each server-rendered detail page,
 * preferring a schema.org `JobPosting` JSON-LD block (with `og:` meta tags and the
 * `<title>` / body HTML as defensive fallbacks). The interfaces below model the
 * normalised, parsed shape the adapter extracts from those documents. Field names
 * mirror the schema.org wire meaning; a handful of aliases are modelled
 * defensively so minor cross-tenant or future-version markup drift never breaks
 * the parser.
 */

/** A single open-role link discovered on the tenant's index page. */
export interface ScoutTalentJobLink {
  /** Role code parsed from `/jobs/{code}-{slug}` (e.g. `J9380`). Used as the ATS id. */
  code: string;
  /** Absolute detail-page URL (`https://{tenant}.applynow.net.au/jobs/{code}-{slug}`). */
  url: string;
}

/** schema.org `PostalAddress` carried inside a `JobPosting.jobLocation`. */
export interface ScoutTalentPostalAddress {
  /** City / town (e.g. "Gordon"). */
  addressLocality?: string | null;
  /** State / region (e.g. "NSW"). */
  addressRegion?: string | null;
  /** Country code or name (e.g. "AU" / "Australia"). */
  addressCountry?: string | { name?: string | null } | null;
}

/** schema.org `Place` carried inside a `JobPosting.jobLocation`. */
export interface ScoutTalentJobLocation {
  address?: ScoutTalentPostalAddress | null;
}

/** schema.org `Organization` carried inside a `JobPosting.hiringOrganization`. */
export interface ScoutTalentHiringOrganization {
  name?: string | null;
}

/**
 * The schema.org `JobPosting` JSON-LD object that may be embedded in a detail
 * page. Only the fields the adapter consumes are typed; everything is optional and
 * defensively narrowed at parse time, since the rendered payload varies by tenant.
 */
export interface ScoutTalentJobPosting {
  '@type'?: string | string[] | null;
  title?: string | null;
  description?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType?: string | string[] | null;
  industry?: string | null;
  /** Free-text "remote OK" flag schema.org uses for home-working roles. */
  jobLocationType?: string | null;
  hiringOrganization?: ScoutTalentHiringOrganization | string | null;
  jobLocation?: ScoutTalentJobLocation | ScoutTalentJobLocation[] | null;
  /** Canonical / apply URL when the JSON-LD advertises one. */
  url?: string | null;
}

/**
 * Normalised view of a single Scout Talent role, assembled from its index link and
 * its parsed detail-page JSON-LD (with `og:` meta / HTML fallbacks).
 */
export interface ScoutTalentJob {
  /** Role code — used as the ATS id. */
  code: string;

  /** Absolute public detail-page / apply URL. */
  url: string;
  /** Canonical URL from JSON-LD `url` / `og:url`, when present. */
  canonicalUrl?: string | null;

  /** Job display title (from JSON-LD `title` / `og:title` / `<title>`). */
  title?: string | null;

  /** Tenant company display name (from `hiringOrganization.name`, else slug). */
  companyName?: string | null;

  /** Full job-ad body as HTML (from JSON-LD `description`), when present. */
  descriptionHtml?: string | null;
  /** Plain-text body fallback (from `og:description`) when no HTML body exists. */
  description?: string | null;

  /** Structured location parts parsed from `jobLocation.address`. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label (from JSON-LD `employmentType`), when present. */
  employmentType?: string | null;

  /** Industry / department label (from JSON-LD `industry`), when present. */
  department?: string | null;

  /** Posted date — `datePosted` from JSON-LD, parsed → YYYY-MM-DD. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
