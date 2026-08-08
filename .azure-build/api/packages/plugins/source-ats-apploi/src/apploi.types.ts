/**
 * TypeScript interfaces for the Apploi public careers surface.
 *
 * An Apploi tenant board (`jobs.apploi.com/profile/{slug}`) is backed by two public, anonymous
 * JSON APIs: a company-profile endpoint `GET api.apploi.com/v1/company_profiles/{slug}` (which
 * yields the tenant's `teams_to_show` team ids) and a job-search feed
 * `GET ats-integrations.apploi.com/search/jobs/?teams={csv}&page={n}` (which returns
 * `{ data: [ …role… ] }`). The adapter GETs the profile, drains the search feed page by page
 * (until an empty `data`), and reads each role. The interfaces below describe the subset of
 * that wire shape the adapter reads plus the normalised internal role assembled from it.
 * Everything the adapter reads is optional and defensively narrowed at parse time, so
 * cross-tenant or future-shape drift never breaks the parser.
 */

/**
 * The company-profile endpoint envelope. Only the fields the adapter reads are modelled —
 * principally the team ids that hold the tenant's open roles.
 */
export interface ApploiCompanyProfile {
  /** Numeric company-profile id (e.g. `30372`). */
  id?: number | string | null;
  /** Company display name (e.g. `Apploi Corp`). */
  name?: string | null;
  /** Profile slug (e.g. `apploi.com`). */
  url_slug?: string | null;
  /** Primary team id holding roles (e.g. `30610`). */
  team_id?: number | string | null;
  /** Comma-separated team ids the board renders (e.g. `30610,32770,37756`). */
  teams_to_show?: string | null;
  /** Free-text primary location line (e.g. `NYC, NY, USA`). */
  primary_location?: string | null;
}

/** The company-profile endpoint response (`{ data: { …profile… } }`). */
export interface ApploiCompanyProfileResponse {
  /** The tenant's company profile. */
  data?: ApploiCompanyProfile | null;
}

/** A role's structured geo location block (`location: { lat, lon }`). */
export interface ApploiGeoLocation {
  /** Latitude. */
  lat?: number | null;
  /** Longitude. */
  lon?: number | null;
}

/**
 * A single role as returned in the job-search feed's `data[]`. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface ApploiJobItem {
  /** Stable string role id — the ATS id (e.g. `1736889`). */
  id?: string | number | null;
  /** Role display title (Apploi names this `name`, not `title`). */
  name?: string | null;
  /** Free-text city (e.g. `New York`). */
  city?: string | null;
  /** Free-text state / region (e.g. `New York`, `KS`). */
  state?: string | null;
  /** Free-text country, when present (e.g. `USA`). */
  country?: string | null;
  /** Full free-text street address line (e.g. `25 West 39th Street New York, …`). */
  address?: string | null;
  /** Structured geo location (lat / lon only — no textual content). */
  location?: ApploiGeoLocation | null;
  /** Company display name on the role (e.g. `Apploi Corp`, the brand under the tenant). */
  brand_name?: string | null;
  /** Rendered HTML description body. */
  description?: string | null;
  /** Employment-type display label (e.g. `Full Time`, `Part Time`, `Per Diem`). */
  job_type?: string | null;
  /** Industry label (used as the department / category, e.g. `Healthcare`). */
  industry?: string | null;
  /** ISO-ish publish date (`YYYY-MM-DD`). */
  published_date?: string | null;
  /** Whether the role is published / live. */
  published?: boolean | null;
  /** Apploi team id the role belongs to. */
  team_id?: number | string | null;
  /** Canonical public detail / apply URL (`https://jobs.apploi.com/view/{id}?…`). */
  redirect_apply_url?: string | null;
  /** External apply URL, when the role redirects off-platform (usually null). */
  external_url?: string | null;
}

/**
 * The job-search feed envelope (`{ data, elasticsearch_errors, errors, buckets }`). Only the
 * path the adapter walks is modelled; `data` is narrowed to an array at parse time.
 */
export interface ApploiJobsResponse {
  /** The open roles on this page (empty array past the last page). */
  data?: ApploiJobItem[] | null;
  /** Elasticsearch backend errors (ignored — defensive). */
  elasticsearch_errors?: unknown;
  /** Search errors (ignored — defensive). */
  errors?: unknown;
  /** Faceting buckets (ignored — defensive). */
  buckets?: unknown;
}

/**
 * Normalised view of a single Apploi role, ready to map to a JobPostDto.
 */
export interface ApploiJob {
  /** Stable ATS id (the role `id`, e.g. `1736889`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `redirect_apply_url` / `/view/{id}`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant / brand company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the role's city / state / country. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's industry. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`). */
  employmentType?: string | null;

  /** Posted date — parsed from `published_date`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
