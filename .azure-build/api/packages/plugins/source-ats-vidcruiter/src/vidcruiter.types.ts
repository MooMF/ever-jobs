/**
 * TypeScript interfaces for the VidCruiter public careers surface.
 *
 * A VidCruiter tenant board (`{tenant}.hiringplatform.com/list/{slug}`) is backed by a single
 * public, anonymous JSON feed the board itself consumes:
 * `GET {tenant}.hiringplatform.com/list/{slug}.json?page={n}` which returns
 * `{ business_processes: [ …role… ] }`. The adapter GETs the feed, drains it page by page (until
 * an empty `business_processes`), and reads each role. The interfaces below describe the subset
 * of that wire shape the adapter reads plus the normalised internal role assembled from it.
 * Everything the adapter reads is optional and defensively narrowed at parse time, so cross-tenant
 * or future-shape drift never breaks the parser.
 */

/**
 * A single role as returned in the board feed's `business_processes[]`. Only the fields the
 * adapter consumes are modelled; all are optional and defensively narrowed.
 */
export interface VidCruiterProcessItem {
  /** Stable numeric role id — the ATS id (e.g. `396787`). */
  id?: number | string | null;
  /** Role display title (VidCruiter names this `name`, not `title`). */
  name?: string | null;
  /** Canonical public detail / apply URL (`https://{tenant}.hiringplatform.com/processes/{uuid}?locale=en`). */
  url?: string | null;
  /** ISO-2 country code for the role location (e.g. `CA`). */
  country_code?: string | null;
  /** State / province / region code for the role location (e.g. `NB`). */
  state_code?: string | null;
  /** Free-text city (e.g. `Moncton`). */
  city?: string | null;
  /** Postal / ZIP code (often empty). */
  postal_code?: string | null;
}

/**
 * The board-feed envelope (`{ business_processes: [ …role… ] }`). Only the path the adapter
 * walks is modelled; `business_processes` is narrowed to an array at parse time.
 */
export interface VidCruiterFeedResponse {
  /** The open roles on this page (empty array past the last page). */
  business_processes?: VidCruiterProcessItem[] | null;
}

/**
 * Normalised view of a single VidCruiter role, ready to map to a JobPostDto.
 */
export interface VidCruiterJob {
  /** Stable ATS id (the role `id`, e.g. `396787`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `/processes/{uuid}?locale=en`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the role's city / state / country. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /**
   * Role description body. The board feed carries no description (it lives on the HTML
   * `/processes/{uuid}` detail page), so this is null for feed-sourced roles — defensively
   * modelled in case a future feed shape ever inlines one.
   */
  descriptionHtml?: string | null;

  /** Department label (the feed carries none — defensive, usually null). */
  department?: string | null;

  /** Employment-type display label (the feed carries none — defensive, usually null). */
  employmentType?: string | null;

  /** Posted date (the feed carries none — defensive, usually null). */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working (inferred from title / location). */
  isRemote?: boolean | null;
}
