/**
 * TypeScript interfaces for the Mindscope (portal{N}.mindscope.com) public careers
 * surface.
 *
 * Mindscope does not expose a single public JSON list feed; each tenant publishes
 * a server-rendered ASP.NET WebForms candidate portal / job board on a path
 * segment of a shared host (`https://portal{N}.mindscope.com/{TENANTCODE}_V2Portal/`).
 * The adapter therefore enumerates a tenant's open postings from the job-board
 * page's `JobDetails.aspx?JobId={id}` anchors and parses each server-rendered
 * detail page, preferring a schema.org `JobPosting` JSON-LD block (with `og:` meta
 * tags and the `<title>` / body HTML as defensive fallbacks). The interfaces below
 * model the normalised, parsed shape the adapter extracts from those documents.
 * Field names mirror the schema.org wire meaning; everything the adapter reads is
 * optional and defensively narrowed at parse time, so minor cross-tenant or
 * future-version markup drift never breaks the parser.
 */

/** A single open-posting link discovered on the tenant's job-board page. */
export interface MindscopeJobLink {
  /** Posting id parsed from `JobDetails.aspx?JobId={id}`. Used as the ATS id. */
  jobId: string;
  /** Absolute detail-page URL (`…/JobDetails.aspx?JobId={id}`). */
  url: string;
}

/** schema.org `PostalAddress` carried inside a `JobPosting.jobLocation`. */
export interface MindscopePostalAddress {
  /** City / town (e.g. "Toronto"). */
  addressLocality?: string | null;
  /** State / region / province (e.g. "ON"). */
  addressRegion?: string | null;
  /** Country code or name (e.g. "CA" / "Canada"). */
  addressCountry?: string | { name?: string | null } | null;
}

/** schema.org `Place` carried inside a `JobPosting.jobLocation`. */
export interface MindscopeJobLocation {
  address?: MindscopePostalAddress | null;
}

/** schema.org `Organization` carried inside a `JobPosting.hiringOrganization`. */
export interface MindscopeHiringOrganization {
  name?: string | null;
}

/**
 * The schema.org `JobPosting` JSON-LD object that may be embedded in a detail
 * page. Only the fields the adapter consumes are typed; everything is optional and
 * defensively narrowed at parse time, since the rendered payload varies by tenant.
 */
export interface MindscopeJobPosting {
  '@type'?: string | string[] | null;
  title?: string | null;
  description?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType?: string | string[] | null;
  industry?: string | null;
  /** Department / occupational category label, when present. */
  occupationalCategory?: string | null;
  /** Free-text "remote OK" flag schema.org uses for home-working roles. */
  jobLocationType?: string | null;
  hiringOrganization?: MindscopeHiringOrganization | string | null;
  jobLocation?: MindscopeJobLocation | MindscopeJobLocation[] | null;
  /** Canonical / apply URL when the JSON-LD advertises one. */
  url?: string | null;
}

/**
 * Normalised view of a single Mindscope posting, assembled from its job-board link
 * and its parsed detail-page JSON-LD (with `og:` meta / HTML fallbacks).
 */
export interface MindscopeJob {
  /** Posting id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail-page / apply URL. */
  url: string;
  /** Canonical URL from JSON-LD `url` / `og:url`, when present. */
  canonicalUrl?: string | null;

  /** Job display title (from JSON-LD `title` / `og:title` / `<title>`). */
  title?: string | null;

  /** Tenant company display name (from `hiringOrganization.name`, else tenant code). */
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

  /** Department / category label (from JSON-LD `occupationalCategory` / `industry`). */
  department?: string | null;

  /** Posted date — `datePosted` from JSON-LD, parsed → YYYY-MM-DD. */
  datePosted?: string | null;

  /** True when the posting advertises remote / home-working. */
  isRemote?: boolean | null;
}
