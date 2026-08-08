/**
 * TypeScript interfaces for the Sense (sensehq.com) public careers surface.
 *
 * Sense tenant career sites (`{tenant}.sensehq.com/careers`) are backed by a public, anonymous
 * JSON feed at `GET /careers/api/jobs?page={n}` (0-based page, fixed 10-row page size), which
 * returns a `{ success, data: { count, rows } }` envelope. The adapter GETs this feed, drains
 * pages by index until `rows` is empty (or `count` / `resultsWanted` is reached), and reads
 * `data.rows[]`. The interfaces below describe the subset of that wire shape the adapter reads
 * plus the normalised internal role assembled from it. Everything the adapter reads is optional
 * and defensively narrowed at parse time, so cross-tenant or future-shape drift never breaks
 * the parser.
 */

/**
 * A role's structured office / workplace block (`office: { city, state, country, … }`), used
 * to derive structured location parts when present.
 */
export interface SenseOffice {
  /** City (e.g. `Bengaluru`). */
  city?: string | null;
  /** State / region (e.g. `Karnataka`). */
  state?: string | null;
  /** Country display name (e.g. `India`, `United States`). */
  country?: string | null;
  /** Free-text street / location line. */
  location?: string | null;
  /** Office display name (e.g. `India HQ`). */
  name?: string | null;
  /** Postal / PIN code. */
  pin_code?: string | null;
}

/**
 * A single role as returned in the public feed's `data.rows[]`. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface SenseJobRow {
  /** Stable numeric role id — the ATS id (e.g. `217`). */
  id?: number | string | null;
  /** Role display title. */
  title?: string | null;
  /** Free-text location line (e.g. `Bengaluru`, `Remote`, `United States`). */
  location?: string | null;
  /** Department / category display name (e.g. `Engineering`). */
  department?: string | null;
  /** Numeric department id, when present. */
  department_id?: number | string | null;
  /** Rendered HTML description body shown on the public career site. */
  description_external?: string | null;
  /** Employment-type token (e.g. `FULLTIME`, `PARTTIME`, `CONTRACT`, `INTERNSHIP`). */
  job_type?: string | null;
  /** Requisition / job code (e.g. `IND00217`). */
  code?: string | null;
  /** Workplace-type token (e.g. `REMOTE`, `ONSITE`, `HYBRID`), when set. */
  workplace_type?: string | null;
  /** Structured office / workplace block. */
  office?: SenseOffice | null;
  /** Number of open positions for the role. */
  open_positions?: number | null;
  /** Lower bound of the required experience range (years). */
  experience_start?: number | null;
  /** Upper bound of the required experience range (years). */
  experience_end?: number | null;
  /** Owning organisation id. */
  organization_id?: number | string | null;
  /** Lifecycle status (e.g. `OPEN`). */
  job_status?: string | null;
  /** Creation timestamp (epoch milliseconds). */
  created_on?: number | string | null;
  /** Last-updated timestamp (epoch milliseconds). */
  updated_on?: number | string | null;
}

/**
 * The feed envelope's `data` block carrying the page's rows + the total count. Modelled
 * defensively — the adapter reads `count` (total across pages) and narrows `rows` to an array.
 */
export interface SenseJobsData {
  /** Total published-role count across all pages. */
  count?: number | null;
  /** The open roles on this page. */
  rows?: SenseJobRow[] | null;
}

/**
 * The top-level public feed envelope `{ success, data: { count, rows } }`. Only the path the
 * adapter walks is modelled; `data.rows` is narrowed to an array at parse time.
 */
export interface SenseJobsResponse {
  /** Upstream success flag. */
  success?: boolean | null;
  /** The page payload (count + rows). */
  data?: SenseJobsData | null;
}

/**
 * Normalised view of a single Sense role, ready to map to a JobPostDto.
 */
export interface SenseJob {
  /** Stable ATS id (the role `id`, stringified, e.g. `217`). */
  atsId: string;

  /** Absolute public detail URL (`{origin}/careers/jobs/{id}`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (de-slugified tenant token — the feed carries no brand). */
  companyName?: string | null;

  /** Structured location parts derived from the role's `office` / free-text location. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's `department`. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`), derived from `job_type`. */
  employmentType?: string | null;

  /** Posted date — parsed from `created_on` (epoch ms), when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
