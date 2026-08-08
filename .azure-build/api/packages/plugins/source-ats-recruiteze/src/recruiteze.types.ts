/**
 * TypeScript interfaces for the Recruiteze public careers surface.
 *
 * Recruiteze tenant career boards (`{tenant}.recruiteze.com/Jobs/AllJobs`) render their role
 * list with a jQuery DataTables grid that POSTs to a public, anonymous server-side endpoint
 * `POST /Jobs/LoadFilteredJobs` (carrying the per-tenant encrypted `companyId` harvested from
 * the board page's hidden `#hdnCompanyID` input). That endpoint returns a DataTables-style
 * envelope `{ draw, recordsTotal, recordsFiltered, data }`. The adapter POSTs this endpoint,
 * drains pages via `recordsFiltered` / `start` + `length`, and reads `data[]`. The interfaces
 * below describe the subset of that wire shape the adapter reads plus the normalised internal
 * role assembled from it. Everything the adapter reads is optional and defensively narrowed
 * at parse time, so cross-tenant or future-shape drift never breaks the parser.
 */

/**
 * A single role as returned in the DataTables grid's `data[]`. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface RecruitezeJobItem {
  /** Numeric role id (e.g. `15293`) — the primary stable ATS id. */
  ID?: number | string | null;
  /** Secondary internal Recruiteze id (e.g. `15729`), used as a fallback id. */
  RecruitezeID?: number | string | null;
  /** Role display title (e.g. `PeopleSoft FSCM Consultants`). */
  JobTitle?: string | null;
  /** Combined location line (e.g. `Remote/California`). */
  Location?: string | null;
  /** Comma-formatted location line (e.g. `Remote, California`). */
  LocationWithComma?: string | null;
  /** City component (e.g. `Remote`, `San Francisco`). */
  City?: string | null;
  /** State / region component (e.g. `California`). */
  State?: string | null;
  /** Description excerpt / snippet (plain text, may be truncated with an ellipsis). */
  Snippet?: string | null;
  /** Longer display text (title + location), occasionally richer than the snippet. */
  DisplayText?: string | null;
  /** Human-formatted posted date (e.g. `30 Jan 2025`). */
  PostedDate?: string | null;
  /** Canonical public detail / apply URL (`{origin}/jobs/jobdetail?id={encryptedId}`). */
  Url?: string | null;
  /** Pre-rendered anchor HTML for the grid cell (unused for parsing, modelled for shape). */
  GridDisplay?: string | null;
  /** Whether the current (anonymous) session already applied — always false anonymously. */
  AppliedForJob?: boolean | null;
  /** Total open-role count echoed on every row (used as a defensive page-drain signal). */
  TotalCount?: number | string | null;
}

/**
 * The DataTables response envelope `{ draw, recordsTotal, recordsFiltered, data }`. Only the
 * path the adapter walks is modelled; `data` is narrowed to an array at parse time.
 */
export interface RecruitezeJobsResponse {
  /** Echoed DataTables draw counter. */
  draw?: number | null;
  /** Total roles before filtering. */
  recordsTotal?: number | null;
  /** Total roles after filtering (the count the adapter drains toward). */
  recordsFiltered?: number | null;
  /** The open roles on this page. */
  data?: RecruitezeJobItem[] | null;
}

/**
 * Normalised view of a single Recruiteze role, ready to map to a JobPostDto.
 */
export interface RecruitezeJob {
  /** Stable ATS id (the role `ID`, or `RecruitezeID` as a fallback). */
  atsId: string;

  /** Absolute public detail URL (the canonical `Url`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (de-slugified tenant token — the feed carries no brand). */
  companyName?: string | null;

  /** Structured location parts derived from the role's city / state. */
  city?: string | null;
  state?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (the snippet / display text), else null. */
  descriptionHtml?: string | null;

  /** Posted date — parsed from `PostedDate`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
