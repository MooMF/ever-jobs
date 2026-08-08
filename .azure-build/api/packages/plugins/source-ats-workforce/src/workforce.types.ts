/**
 * TypeScript interfaces for the Workforce.com public hiring surface.
 *
 * Workforce.com tenant hiring lives on a regional candidate-facing host
 * (`app.workforce.com` / `eu.workforce.com`). Each open role has a public, anonymous apply
 * page at `/ats/apply/job/{uuid}` that server-renders the full role detail plus the
 * application form; a tenant's careers / board page links to those apply pages. The adapter
 * harvests the apply-page links from the board HTML, then parses each role's apply page —
 * preferring a schema.org `JobPosting` `application/ld+json` island when present and degrading
 * to scraped `<title>` / `og:` meta otherwise.
 *
 * The interfaces below describe the subset of that wire shape the adapter reads plus the
 * normalised internal role assembled from it. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant or future-shape drift never breaks the
 * parser.
 */

/**
 * The schema.org `PostalAddress` embedded in a role's `jobLocation`. Workforce apply pages
 * carry a postal-address location line (e.g. "48 Scrutton Street, London, EC2A 4HH, UNITED
 * KINGDOM"); when a structured-data block is present it splits this into address parts.
 */
export interface WorkforcePostalAddress {
  /** Street address line, when present. */
  streetAddress?: string | null;
  /** City / locality (e.g. `London`). */
  addressLocality?: string | null;
  /** State / region (e.g. `England`). */
  addressRegion?: string | null;
  /** Postal / ZIP code, when present. */
  postalCode?: string | null;
  /** Country name or code (e.g. `United Kingdom` / `GB`). */
  addressCountry?: string | { name?: string | null } | null;
}

/**
 * A schema.org `Place` carrying the structured `address` for a role's `jobLocation`.
 */
export interface WorkforceJobLocation {
  /** Structured postal address for the role. */
  address?: WorkforcePostalAddress | null;
}

/**
 * A schema.org `Organization` carrying the employer brand for a role's `hiringOrganization`.
 */
export interface WorkforceHiringOrganization {
  /** Employer display / brand name. */
  name?: string | null;
}

/**
 * The subset of a schema.org `JobPosting` `application/ld+json` block the adapter consumes.
 * Present on richer apply pages; all fields optional and defensively narrowed. `jobLocation`
 * and `hiringOrganization` may each arrive as a single object or an array (schema.org allows
 * both); the adapter narrows to the first usable element.
 */
export interface WorkforceJobPostingLd {
  /** schema.org `@type`; the adapter selects the block whose type includes `JobPosting`. */
  '@type'?: string | string[] | null;
  /** Role display title. */
  title?: string | null;
  /** Role description body (HTML or plain). */
  description?: string | null;
  /** ISO publish timestamp, when present. */
  datePosted?: string | null;
  /** Employment-type token(s) (e.g. `FULL_TIME`). */
  employmentType?: string | string[] | null;
  /** `TELECOMMUTE` when the role is fully remote. */
  jobLocationType?: string | null;
  /** Employer brand (single object on Workforce pages). */
  hiringOrganization?: WorkforceHiringOrganization | WorkforceHiringOrganization[] | null;
  /** Structured location (single object or array). */
  jobLocation?: WorkforceJobLocation | WorkforceJobLocation[] | null;
  /** Stable per-role identifier, when the block exposes one. */
  identifier?: string | { value?: string | null } | null;
}

/**
 * A single open role discovered on a board page: its UUID (harvested from the apply link) and
 * the absolute apply URL. The adapter parses each role's apply page into a `WorkforceJob`.
 */
export interface WorkforceJobRef {
  /** Role UUID — the stable ATS id and the `/ats/apply/job/{uuid}` URL segment. */
  uuid: string;
  /** Absolute public apply / detail URL. */
  url: string;
}

/**
 * Normalised view of a single Workforce role, ready to map to a JobPostDto.
 */
export interface WorkforceJob {
  /** Stable ATS id (the role UUID). */
  atsId: string;

  /** Absolute public detail URL (the role's apply page). */
  url: string;

  /** Absolute public apply URL (the same apply page hosts the application form). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant employer display name (from `hiringOrganization.name`, else the board host/slug). */
  companyName?: string | null;

  /** Structured location parts derived from the role's `jobLocation` address. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location line, used for remote detection. */
  locationText?: string | null;

  /** Role description body (when the apply page exposes one), else null. */
  descriptionHtml?: string | null;

  /** Employment-type label (e.g. `Full Time`), when present. */
  employmentType?: string | null;

  /** Posted date — parsed from `datePosted`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
