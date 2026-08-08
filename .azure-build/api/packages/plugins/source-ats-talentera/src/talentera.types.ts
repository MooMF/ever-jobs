/**
 * TypeScript interfaces for the Talentera public careers surface.
 *
 * A Talentera tenant portal (`{codename}.talentera.com`) is backed by a public, anonymous JSON
 * endpoint the board's Vue SPA consumes: the job-search manager
 * `GET /app/control/byt_job_search_manager?action=1&token={t}&query={qs}&body=job-search-results&lan={lang}`,
 * which returns `{ totalJobs, currentPage, view, jobs: [ …role… ], cluster, totalVacancies }`.
 * The adapter mints an anonymous guest token from the public results page, then drains the
 * search manager page by page (bounded by `totalJobs` and a page cap), reading each role. The
 * interfaces below describe the subset of that wire shape the adapter reads plus the normalised
 * internal role assembled from it. Everything the adapter reads is optional and defensively
 * narrowed at parse time, so cross-tenant or future-shape drift never breaks the parser.
 */

/**
 * A single role as returned in the search manager's `jobs[]`. Card templates vary across
 * tenants, so only the fields the adapter consumes are modelled; all are optional and
 * defensively narrowed. The canonical, always-present field is the string `id`.
 */
export interface TalenteraJobItem {
  /** Stable string role id — the ATS id (e.g. `5438332`; appears as `JB5438332` on the detail page). */
  id?: string | number | null;
  /** Role display title. */
  title?: string | null;
  /** Rendered HTML description / snippet body (Talentera names this `desc`). */
  desc?: string | null;
  /** Alternate full-description field some card templates expose. */
  description?: string | null;
  /** Free-text combined location line (e.g. `Abu Dhabi, UAE`), when the card exposes one. */
  location?: string | null;
  /** Free-text city, when present. */
  city?: string | null;
  /** Free-text country (also used as the URL country segment), when present. */
  country?: string | null;
  /** Free-text state / region, when present. */
  state?: string | null;
  /** Employment-type display label (e.g. `Full Time`), when present. */
  type?: string | null;
  /** Alternate employment-type field some card templates expose. */
  job_type?: string | null;
  /** Category / function label, used as the department (e.g. `Aviation`), when present. */
  category?: string | null;
  /** Alternate department field some card templates expose. */
  department?: string | null;
  /** Posted / publish date string, when present. */
  date?: string | null;
  /** Alternate posted-date field some card templates expose. */
  postedDate?: string | null;
  /** Alternate posted-date field some card templates expose. */
  posted_date?: string | null;
  /** Canonical public detail path / URL (`/en/{country}/jobs/{slug}-{id}/`), when present. */
  url?: string | null;
  /** Title slug used to build the detail URL, when the card exposes it separately. */
  slug?: string | null;
  /** Whether the role advertises remote / home-working, when the card flags it. */
  remote?: boolean | null;
  /** Vacancy count for the role, when present (ignored — defensive). */
  vacancies?: number | string | null;
}

/**
 * The job-search manager envelope (`{ totalJobs, currentPage, view, jobs, cluster,
 * totalVacancies }`). Only the path the adapter walks is modelled; `jobs` is narrowed to an
 * array at parse time. An anti-automation guard answers a `{ status, url }` shape instead, which
 * the adapter treats as a degrade-to-empty signal.
 */
export interface TalenteraSearchResponse {
  /** Total open roles across all pages for this query (drives pagination). */
  totalJobs?: number | string | null;
  /** The 1-based page index this envelope represents. */
  currentPage?: number | string | null;
  /** Board view mode (`list` / `grid`) — ignored, defensive. */
  view?: string | null;
  /** The open roles on this page (empty array past the last page). */
  jobs?: TalenteraJobItem[] | null;
  /** Faceting clusters (ignored — defensive). */
  cluster?: unknown;
  /** Total vacancy count across roles (ignored — defensive). */
  totalVacancies?: number | string | null;
  /** Guard status when the anonymous guest token is rejected (e.g. `fail`). */
  status?: string | null;
  /** Guard redirect URL when the token is rejected (e.g. `/en/unauthorized-access/`). */
  url?: string | null;
}

/**
 * Normalised view of a single Talentera role, ready to map to a JobPostDto.
 */
export interface TalenteraJob {
  /** Stable ATS id (the role `id`, e.g. `5438332`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `/en/{country}/jobs/{slug}-{id}/`). */
  url: string;

  /** Absolute public apply URL (`/en/job-application/?jb_id={id}`). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant / brand company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the role card. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's category. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`). */
  employmentType?: string | null;

  /** Posted date — parsed from the card's date field, when available (`YYYY-MM-DD`). */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
