/**
 * TypeScript interfaces for the Roubler public careers surface.
 *
 * A Roubler tenant board (`app.roubler.com/careers/{companyId}`) is backed by a public careers
 * feed on the region-sharded careers host (`graphql.{region}.roubler.com`): a job-advert feed
 * `GET /static/careers/{companyId}/adverts?page={n}` that returns `{ data: [ …role… ], meta }`.
 * The adapter GETs the feed, drains it page by page (until an empty `data`), and reads each
 * role. The interfaces below describe the subset of that wire shape the adapter reads plus the
 * normalised internal role assembled from it. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant or future-shape drift never breaks the
 * parser.
 *
 * NOTE: an anonymous careers response could not be captured live (2026-06-04); these shapes are
 * a defensive best-effort model of the documented public careers surface and are narrowed
 * conservatively so unexpected field names / nesting never throw.
 */

/** A role's structured location block, when the feed nests location parts. */
export interface RoublerAdvertLocation {
  /** Free-text city / suburb (e.g. `Sydney`). */
  city?: string | null;
  /** Free-text suburb / locality, when distinct from city. */
  suburb?: string | null;
  /** Free-text state / region (e.g. `NSW`). */
  state?: string | null;
  /** Free-text region, when distinct from state. */
  region?: string | null;
  /** Free-text country (e.g. `Australia`). */
  country?: string | null;
  /** Combined free-text location line, when the feed pre-joins it. */
  name?: string | null;
  /** Combined free-text location line (alternate key). */
  label?: string | null;
}

/**
 * A single role as returned in the careers feed's `data[]`. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed. Roubler may emit a given
 * value under more than one key across regions / tenants, so the adapter probes alternates.
 */
export interface RoublerAdvertItem {
  /** Stable role id — the ATS id (string or numeric). */
  id?: string | number | null;
  /** Alternate role id key (e.g. `advertId`). */
  advertId?: string | number | null;
  /** Alternate role id key (e.g. `uuid`). */
  uuid?: string | null;

  /** Role display title. */
  title?: string | null;
  /** Alternate title key (e.g. `name`). */
  name?: string | null;
  /** Alternate title key (e.g. `position`). */
  position?: string | null;

  /** Rendered HTML / rich description body. */
  description?: string | null;
  /** Alternate description key (e.g. `summary`). */
  summary?: string | null;
  /** Alternate description key (e.g. `content`). */
  content?: string | null;

  /** Structured or free-text location. */
  location?: RoublerAdvertLocation | string | null;
  /** Free-text city, when emitted flat (not nested under `location`). */
  city?: string | null;
  /** Free-text state / region, when emitted flat. */
  state?: string | null;
  /** Free-text country, when emitted flat. */
  country?: string | null;

  /** Employment-type display label (e.g. `Full Time`, `Casual`, `Remote`). */
  employmentType?: string | null;
  /** Alternate employment-type key (e.g. `jobType`). */
  jobType?: string | null;
  /** Alternate employment-type key (e.g. `type`). */
  type?: string | null;

  /** Department / category label (e.g. `Hospitality`). */
  department?: string | null;
  /** Alternate department key (e.g. `category`). */
  category?: string | null;

  /** Company / brand display name on the role. */
  companyName?: string | null;
  /** Alternate company-name key (e.g. `brand`). */
  brand?: string | null;

  /** ISO-ish publish date / timestamp. */
  publishedAt?: string | null;
  /** Alternate publish-date key (e.g. `datePosted`). */
  datePosted?: string | null;
  /** Alternate publish-date key (e.g. `createdAt`). */
  createdAt?: string | null;

  /** Canonical public detail / apply URL, when the feed emits one. */
  applyUrl?: string | null;
  /** Alternate apply / detail URL key (e.g. `url`). */
  url?: string | null;
  /** Alternate apply / detail URL key (e.g. `link`). */
  link?: string | null;

  /** Whether the role advertises remote working, when the feed emits a flag. */
  remote?: boolean | null;
}

/** The careers-feed pagination meta, when present. Only fields the adapter may read are modelled. */
export interface RoublerFeedMeta {
  /** Total advert count across all pages, when present. */
  total?: number | null;
  /** Current page index, when present. */
  page?: number | null;
  /** Total page count, when present. */
  pages?: number | null;
  /** Per-page size, when present. */
  perPage?: number | null;
}

/**
 * The careers-feed envelope (`{ data: [ …role… ], meta }`). Some tenants may return a bare
 * array or nest the roles under `adverts` / `results`; the adapter narrows all of these at parse
 * time, so only the canonical keys are modelled here.
 */
export interface RoublerFeedResponse {
  /** The open roles on this page (empty array past the last page). */
  data?: RoublerAdvertItem[] | null;
  /** Alternate roles array key (e.g. `adverts`). */
  adverts?: RoublerAdvertItem[] | null;
  /** Alternate roles array key (e.g. `results`). */
  results?: RoublerAdvertItem[] | null;
  /** Pagination meta, when present (ignored beyond defensive reads). */
  meta?: RoublerFeedMeta | null;
}

/**
 * Normalised view of a single Roubler role, ready to map to a JobPostDto.
 */
export interface RoublerJob {
  /** Stable ATS id (the role `id` / `advertId` / `uuid`). */
  atsId: string;

  /** Absolute public detail URL (the canonical apply URL / derived `/careers/{companyId}/{id}`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant / brand company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the role's location. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's department / category. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`). */
  employmentType?: string | null;

  /** Posted date — parsed from `publishedAt` / `datePosted` / `createdAt`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
