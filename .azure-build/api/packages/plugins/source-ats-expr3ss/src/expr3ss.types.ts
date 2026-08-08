/**
 * TypeScript interfaces for the Expr3ss! public careers surface.
 *
 * Expr3ss! tenant boards live on per-tenant sub-domains at `https://{tenant}.expr3ss.com/home`.
 * The board is a server-rendered page that lists each open role as an apply anchor
 * (`…/ApplyOnline/Default.aspx?ID={id}`) and is published for aggregators with schema.org
 * `JobPosting` JSON-LD embedded per role. The adapter harvests the per-role anchors and, when
 * present, the JSON-LD island. The interfaces below describe the subset of those wire shapes the
 * adapter reads plus the normalised internal role assembled from them. Everything the adapter
 * reads is optional and defensively narrowed at parse time, so cross-tenant or future-shape
 * drift never breaks the parser.
 */

/**
 * The `hiringOrganization` block of a schema.org `JobPosting` JSON-LD island. The adapter reads
 * `name` as the tenant display brand when the board exposes JSON-LD.
 */
export interface Expr3ssHiringOrganization {
  /** Organisation display name (the tenant brand). */
  name?: string | null;
}

/**
 * The structured `address` nested in a schema.org `place` / `jobLocation` block. Only the
 * postal-address parts the adapter consumes are modelled.
 */
export interface Expr3ssPostalAddress {
  /** Town / city (`addressLocality`). */
  addressLocality?: string | null;
  /** Region / state (`addressRegion`, e.g. `NSW`, `VIC`). */
  addressRegion?: string | null;
  /** Country (`addressCountry`) — a string or a nested `{ name }` (e.g. `AU`, `Australia`). */
  addressCountry?: string | { name?: string | null } | null;
}

/**
 * A schema.org `place` / `jobLocation` block carrying the structured postal address for a role,
 * when the board / detail page exposes JSON-LD.
 */
export interface Expr3ssJobLocation {
  /** Structured postal address for the role. */
  address?: Expr3ssPostalAddress | null;
}

/**
 * A schema.org `JobPosting` JSON-LD island as embedded on a board / detail page. Only the fields
 * the adapter consumes are modelled; all are optional and defensively narrowed.
 */
export interface Expr3ssJsonLd {
  /** Schema.org type discriminator (expected `JobPosting`). */
  '@type'?: string | string[] | null;
  /** Role display title. */
  title?: string | null;
  /** Canonical public detail / apply URL for the role. */
  url?: string | null;
  /** Apply action URL, when present (a string or a nested action `{ url }`). */
  applicationContact?: string | null;
  /** Role description body (HTML), when present. */
  description?: string | null;
  /** ISO publish timestamp, when present. */
  datePosted?: string | null;
  /** Employment type (e.g. `FULL_TIME`, `PART_TIME`, `CASUAL`), when present. */
  employmentType?: string | string[] | null;
  /** Industry / category label, when present (used as the department). */
  industry?: string | null;
  /** Hiring organisation (the tenant brand). */
  hiringOrganization?: Expr3ssHiringOrganization | null;
  /** Structured job location (a single place or a list). */
  jobLocation?: Expr3ssJobLocation | Expr3ssJobLocation[] | null;
  /** Whether the role is advertised as remote / telecommute (schema.org `jobLocationType`). */
  jobLocationType?: string | null;
}

/**
 * A per-role apply anchor harvested from the server-rendered board: the
 * `ApplyOnline/Default.aspx?ID={id}` detail href plus the anchor's inner text (a title fallback
 * when no JSON-LD is present).
 */
export interface Expr3ssJobAnchor {
  /** The per-role apply / detail href (absolute or host-relative). */
  href: string;
  /** The anchor's inner text — used as a title fallback. */
  text?: string | null;
}

/**
 * Normalised view of a single Expr3ss! role, ready to map to a JobPostDto.
 */
export interface Expr3ssJob {
  /** Stable ATS id (the role's numeric `ID` query value / trailing url id). */
  atsId: string;

  /** Absolute public detail URL (the canonical board apply page). */
  url: string;

  /** Absolute public apply URL (the same `ApplyOnline` page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (the JSON-LD brand, else the de-slugified sub-domain label). */
  companyName?: string | null;

  /** Structured location parts derived from any JSON-LD job location. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (when the board / detail page exposes one), else null. */
  descriptionHtml?: string | null;

  /** Department / category label, when present. */
  department?: string | null;

  /** Employment-type label, when present. */
  employmentType?: string | null;

  /** Posted date — parsed from `datePosted`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
