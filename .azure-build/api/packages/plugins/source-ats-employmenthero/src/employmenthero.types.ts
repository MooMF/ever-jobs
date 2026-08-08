/**
 * TypeScript interfaces for the Employment Hero public careers surface.
 *
 * An Employment Hero tenant board (`jobs.employmenthero.com/organisations/{slug}`, canonically
 * `employmenthero.com/jobs/organisations/{slug}/`) is backed by a single public, anonymous JSON
 * API the board itself consumes: a career-page jobs feed
 * `GET services.employmenthero.com/ats/api/v1/career_page/organisations/{slug}/jobs?page_index={n}&item_per_page={size}`
 * which returns `{ data: { items: [ …role… ], page_index, item_per_page, total_pages,
 * total_items } }`. The adapter GETs the feed, drains it by `page_index` (bounded by
 * `total_pages` and a page cap), and reads each role. The interfaces below describe the subset
 * of that wire shape the adapter reads plus the normalised internal role assembled from it.
 * Everything the adapter reads is optional and defensively narrowed at parse time, so
 * cross-tenant or future-shape drift never breaks the parser.
 */

/**
 * A role's structured remote-working block (`remote_setting`). Only the fields the adapter
 * inspects are modelled.
 */
export interface EmploymentHeroRemoteSetting {
  /** Whether the role can be worked from anywhere (fully remote). */
  anywhere?: boolean | null;
  /** ISO-3166 alpha-2 country code the remote role is anchored to, when present. */
  country_code?: string | null;
}

/**
 * A single role as returned in the career-page jobs feed's `data.items[]`. Only the fields the
 * adapter consumes are modelled; all are optional and defensively narrowed.
 */
export interface EmploymentHeroJobItem {
  /** Stable string role id (UUID) — the ATS id (e.g. `ed3c8943-7486-4cf6-bf3c-377cd0aa7ac0`). */
  id?: string | null;
  /** Role display title (e.g. `HR Advisor`). */
  title?: string | null;
  /** Slug token forming the public `/jobs/position/{friendly_id}/` detail URL. */
  friendly_id?: string | null;
  /** Rendered HTML description body. */
  description?: string | null;
  /** Free-text company / mission overview (HTML or plain), shown above the description. */
  company_overview?: string | null;
  /** ISO-3166 alpha-2 country code (e.g. `GB`, `AU`). */
  country_code?: string | null;
  /** Free-text location line (e.g. `Greater London, SouthEast E1`). */
  vendor_location_name?: string | null;
  /** Whether the role is flagged remote. */
  remote?: boolean | null;
  /** Workplace arrangement token (e.g. `remote_anywhere`, `hybrid`). */
  workplace_type?: string | null;
  /** Structured remote-working block. */
  remote_setting?: EmploymentHeroRemoteSetting | null;
  /** Team name — used as the role's department / category (e.g. `HR Advisory`). */
  team_name?: string | null;
  /** Employment-type display label (e.g. `Full-time`, `Part-time`). */
  employment_type_name?: string | null;
  /** Employment-term display label (e.g. `Permanent`, `Contract`). */
  employment_term_name?: string | null;
  /** Experience-level display label (e.g. `Mid-level Senior`). */
  experience_level_name?: string | null;
  /** Tenant id (UUID) the role belongs to. */
  organisation_id?: string | null;
  /** Tenant friendly id / slug (e.g. `employmenthero`). */
  organisation_friendly_id?: string | null;
  /** Tenant display name (e.g. `Employment Hero`). */
  organisation_name?: string | null;
  /** Tenant logo URL, when present. */
  organisation_logo?: string | null;
  /** Salary currency code (e.g. `GBP`), when present. */
  salary_currency?: string | null;
  /** Minimum salary, when published. */
  salary_min?: number | string | null;
  /** Maximum salary, when published. */
  salary_max?: number | string | null;
  /** ISO-8601 creation timestamp (e.g. `2026-06-02T12:51:22Z`). */
  created_at?: string | null;
}

/**
 * The career-page jobs feed `data` envelope (`{ items, page_index, item_per_page, total_pages,
 * total_items }`). Only the path the adapter walks is modelled; `items` is narrowed to an array
 * at parse time.
 */
export interface EmploymentHeroJobsData {
  /** The open roles on this page (empty array when the tenant has none). */
  items?: EmploymentHeroJobItem[] | null;
  /** Roles per page echoed back by the feed. */
  item_per_page?: number | null;
  /** 1-based index of the current page. */
  page_index?: number | null;
  /** Total number of pages available for the requested page size. */
  total_pages?: number | null;
  /** Total number of roles across all pages. */
  total_items?: number | null;
}

/** The career-page jobs feed response (`{ data: { items, … } }`). */
export interface EmploymentHeroJobsResponse {
  /** The paginated jobs envelope. */
  data?: EmploymentHeroJobsData | null;
}

/**
 * Normalised view of a single Employment Hero role, ready to map to a JobPostDto.
 */
export interface EmploymentHeroJob {
  /** Stable ATS id (the role `id` UUID). */
  atsId: string;

  /** Absolute public detail URL (the canonical `/jobs/position/{friendly_id}/`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name. */
  companyName?: string | null;

  /** Tenant logo URL, when present. */
  companyLogo?: string | null;

  /** Structured location parts derived from the role's location line / country code. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's team name. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full-time`). */
  employmentType?: string | null;

  /** Posted date — parsed from `created_at`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
