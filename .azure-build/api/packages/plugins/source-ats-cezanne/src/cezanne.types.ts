/**
 * TypeScript interfaces for the Cezanne HR public careers surface.
 *
 * Cezanne HR tenant boards live on the shared hosted careers host at
 * `https://cezanneondemand.intervieweb.it/{tenant}/{lang}/career`. The board is a
 * server-rendered page that lists each open role as an anchor to its per-role
 * `jobvacancy` detail page; richer boards / detail pages additionally embed schema.org
 * `JobPosting` JSON-LD. The adapter harvests the per-role anchors and, when present, the
 * JSON-LD island. The interfaces below describe the subset of those wire shapes the
 * adapter reads plus the normalised internal role assembled from them. Everything the
 * adapter reads is optional and defensively narrowed at parse time, so cross-tenant or
 * future-shape drift never breaks the parser.
 */

/**
 * The `hiringOrganization` block of a schema.org `JobPosting` JSON-LD island. The adapter
 * reads `name` as the tenant display brand when the board exposes JSON-LD.
 */
export interface CezanneHiringOrganization {
  /** Organisation display name (the tenant brand). */
  name?: string | null;
}

/**
 * The structured `address` nested in a schema.org `place` / `jobLocation` block. Only the
 * postal-address parts the adapter consumes are modelled.
 */
export interface CezannePostalAddress {
  /** Town / city (`addressLocality`). */
  addressLocality?: string | null;
  /** Region / state (`addressRegion`). */
  addressRegion?: string | null;
  /** Country (`addressCountry`) — a string or a nested `{ name }`. */
  addressCountry?: string | { name?: string | null } | null;
}

/**
 * A schema.org `place` / `jobLocation` block carrying the structured postal address for a
 * role, when the board / detail page exposes JSON-LD.
 */
export interface CezanneJobLocation {
  /** Structured postal address for the role. */
  address?: CezannePostalAddress | null;
}

/**
 * A schema.org `JobPosting` JSON-LD island as embedded on a board / detail page. Only the
 * fields the adapter consumes are modelled; all are optional and defensively narrowed.
 */
export interface CezanneJsonLd {
  /** Schema.org type discriminator (expected `JobPosting`). */
  '@type'?: string | string[] | null;
  /** Role display title. */
  title?: string | null;
  /** Canonical public detail URL for the role. */
  url?: string | null;
  /** Role description body (HTML), when present. */
  description?: string | null;
  /** ISO publish timestamp, when present. */
  datePosted?: string | null;
  /** Employment type (e.g. `FULL_TIME`), when present. */
  employmentType?: string | string[] | null;
  /** Hiring organisation (the tenant brand). */
  hiringOrganization?: CezanneHiringOrganization | null;
  /** Structured job location (a single place or a list). */
  jobLocation?: CezanneJobLocation | CezanneJobLocation[] | null;
}

/**
 * A per-role anchor harvested from the server-rendered board: the `jobvacancy` detail
 * href plus the anchor's inner text (a title fallback when no JSON-LD is present).
 */
export interface CezanneJobAnchor {
  /** The per-role detail href (absolute or host-relative). */
  href: string;
  /** The anchor's inner text — used as a title fallback. */
  text?: string | null;
}

/**
 * Normalised view of a single Cezanne role, ready to map to a JobPostDto.
 */
export interface CezanneJob {
  /** Stable ATS id (the trailing numeric `jobvacancy/{slug}/{id}` segment). */
  atsId: string;

  /** Absolute public detail URL (the canonical careers-board `jobvacancy` page). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (the JSON-LD brand, else the de-slugified slug). */
  companyName?: string | null;

  /** Structured location parts derived from any JSON-LD job location. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (when the board / detail page exposes one), else null. */
  descriptionHtml?: string | null;

  /** Employment-type label, when present. */
  employmentType?: string | null;

  /** Posted date — parsed from `datePosted`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
