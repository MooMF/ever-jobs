/**
 * TypeScript interfaces for the Kenjo public careers surface.
 *
 * Kenjo tenant career sites (`{tenant}.kenjo.io`) are backed by a public, anonymous JSON API
 * served on the tenant's own career-site origin. The list endpoint
 * `GET /api/controller/career-site/public/{tenant}/positions` returns a **career-site config
 * envelope** (company branding + metadata) carrying an `activePositions[]` array of summary
 * roles. The per-role detail endpoint
 * `GET /api/controller/career-site/public/{tenant}/positions/{customUrl}` returns a single
 * role enriched with its `jobDescription.html` body. The interfaces below describe the
 * subset of that wire shape the adapter reads plus the normalised internal role assembled
 * from it. Everything the adapter reads is optional and defensively narrowed at parse time,
 * so cross-tenant or future-shape drift never breaks the parser.
 */

/** A role's rich-text description block — Kenjo exposes a rendered HTML body. */
export interface KenjoJobDescription {
  /** Rendered HTML body. */
  html?: string | null;
  /** Plain-text body, when present. */
  text?: string | null;
}

/**
 * A single role as returned in the list endpoint's `activePositions[]` (summary form) and,
 * enriched, on the per-role detail endpoint. Only the fields the adapter consumes are
 * modelled; all are optional and defensively narrowed.
 */
export interface KenjoPosition {
  /** Stable Mongo-style role id (e.g. `5dde37c7913b8600132907a9`) — the ATS id. */
  _id?: string | null;
  /** Role display title. */
  jobTitle?: string | null;
  /**
   * Slug used as the per-role detail key and public detail-page path segment
   * (e.g. `initiative`). The detail endpoint is keyed by `customUrl`, NOT `_id`.
   */
  customUrl?: string | null;
  /** Owning company id. */
  companyId?: string | null;
  /** Owning office id. */
  officeId?: string | null;
  /** Whether the role is pinned to the top of the board. */
  pinned?: boolean | null;
  /** Employment type display label (e.g. `Full-time`, `Part-time`). */
  positionType?: string | null;
  /** Company display name (e.g. `Kenjo GmbH`) — the feed carries a real brand here. */
  companyName?: string | null;
  /** Office / location display name (e.g. `Berlin`). */
  officeName?: string | null;
  /** Department display name, when present. */
  departmentName?: string | null;
  /** City line, when present. */
  city?: string | null;
  /** Country line, when present. */
  country?: string | null;
  /** Rich-text role description (HTML) — present on the detail endpoint. */
  jobDescription?: KenjoJobDescription | null;
  /** ISO created / published timestamp, when present. */
  createdAt?: string | null;
  /** ISO published timestamp, when present. */
  publishedAt?: string | null;
}

/**
 * The list endpoint's career-site config envelope. Only the fields the adapter walks are
 * modelled — chiefly `activePositions[]` (narrowed to an array at parse time) and the
 * company branding fields used as a fallback display name.
 */
export interface KenjoCareerSiteResponse {
  /** Company display name from the career-site config. */
  companyName?: string | null;
  /** Career-site sub-domain label echoed back. */
  subdomain?: string | null;
  /** Whether the career site is active / live. */
  active?: boolean | null;
  /** Default content language code (e.g. `en`, `de`, `es`). */
  defaultLanguage?: string | null;
  /** The tenant's active, public roles. */
  activePositions?: KenjoPosition[] | null;
}

/**
 * Normalised view of a single Kenjo role, ready to map to a JobPostDto.
 */
export interface KenjoJob {
  /** Stable ATS id (the role `_id`). */
  atsId: string;

  /** Absolute public detail URL (`{origin}/positions/{customUrl}`). */
  url: string;

  /** Absolute public apply URL (the detail page hosts the apply flow inline). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Company display name (from the role / career-site config; falls back to the tenant). */
  companyName?: string | null;

  /** Structured location parts derived from the role's office / city / country. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's department name when present. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full-time`). */
  employmentType?: string | null;

  /** Posted date — parsed from `publishedAt` / `createdAt`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
