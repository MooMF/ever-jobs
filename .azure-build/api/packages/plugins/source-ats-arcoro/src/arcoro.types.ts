/**
 * TypeScript interfaces for the Arcoro (BirdDogHR) public job-board surface.
 *
 * Arcoro does not expose a single JSON list feed; the listing/search page is
 * client-rendered. The adapter therefore enumerates a tenant's open roles by
 * harvesting `/job/{jobId}` links from the listing/sitemap HTML and parsing each
 * server-rendered detail page (`/job/{jobId}`). The interfaces below model the
 * normalised, parsed shape the adapter extracts from those documents. Field
 * names mirror the wire meaning; a few aliases are modelled defensively so minor
 * cross-tenant or future-version markup drift never breaks the parser.
 */

/** A single open-role link harvested from a tenant's listing page / sitemap. */
export interface ArcoroJobLink {
  /** Numeric job id parsed from `/job/{jobId}`. Used as the ATS id. */
  jobId: string;
  /** Absolute detail-page URL (`https://{host}/job/{jobId}`). */
  url: string;
}

/**
 * Minimal view of a schema.org `JobPosting` JSON-LD block, when a tenant emits
 * one. Only the fields the adapter consumes are modelled; everything is
 * optional and read defensively.
 */
export interface ArcoroJsonLd {
  /** Usually "JobPosting". */
  '@type'?: string | string[];
  /** Role title. */
  title?: string | null;
  /** Job-ad body (may contain HTML). */
  description?: string | null;
  /** ISO date the role was posted. */
  datePosted?: string | null;
  /** Schema.org `employmentType` ("FULL_TIME", "PART_TIME", …). */
  employmentType?: string | string[] | null;
  /** Canonical / public role URL. */
  url?: string | null;
  /** Hiring organisation. */
  hiringOrganization?: { name?: string | null } | string | null;
  /** Job location (address parts). */
  jobLocation?: ArcoroJsonLdLocation | ArcoroJsonLdLocation[] | null;
  /** Some emitters set this when the role is remote. */
  jobLocationType?: string | null;
}

/** A schema.org `place`/`postalAddress` fragment within a `JobPosting`. */
export interface ArcoroJsonLdLocation {
  address?: {
    addressLocality?: string | null;
    addressRegion?: string | null;
    addressCountry?: string | { name?: string | null } | null;
    postalCode?: string | null;
  } | null;
}

/**
 * Normalised view of a single Arcoro role, assembled from its `/job/{id}` link
 * and its parsed detail page (JSON-LD preferred, then meta tags, then visible
 * HTML).
 */
export interface ArcoroJob {
  /** Numeric job id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail-page / apply URL. */
  url: string;
  /** Canonical role URL (from JSON-LD `url` / `og:url`), when present. */
  canonicalUrl?: string | null;

  /** Job display title (from JSON-LD / `og:title` / `<h1>` / `<title>`). */
  title?: string | null;

  /** Tenant company display name (from JSON-LD `hiringOrganization` / body). */
  companyName?: string | null;

  /** Full job-ad body — HTML when available (JSON-LD `description`). */
  descriptionHtml?: string | null;
  /** Full job-ad body — plain text (`og:description` / meta description). */
  description?: string | null;

  /** Structured location parts (from JSON-LD address / a "City, ST ZIP" line). */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label (schema.org `employmentType` or a body label). */
  employmentType?: string | null;

  /** Posted date — `YYYY-MM-DD` parsed from JSON-LD `datePosted`, when present. */
  datePosted?: string | null;

  /** Whether the role was detected as remote. */
  isRemote?: boolean | null;
}
