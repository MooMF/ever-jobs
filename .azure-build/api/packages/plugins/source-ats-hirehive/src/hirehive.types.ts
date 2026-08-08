/**
 * TypeScript interfaces for the Hirehive public careers surface.
 *
 * Hirehive tenant career sites (`{tenant}.hirehive.com`) are backed by a public, anonymous
 * JSON feed at `GET /api/v2/jobs?page={n}&page_size={k}&source=CareerSite`, which returns a
 * JSON:API-style envelope `{ meta, links, items }`. The adapter GETs this feed, drains
 * pages via `meta.has_next_page`, and reads `items[]`. The interfaces below describe the
 * subset of that wire shape the adapter reads plus the normalised internal role assembled
 * from it. Everything the adapter reads is optional and defensively narrowed at parse time,
 * so cross-tenant or future-shape drift never breaks the parser.
 */

/** A role's structured country block (`country: { name, code }`). */
export interface HirehiveCountry {
  /** Country display name (e.g. `Ireland`, `United States`). */
  name?: string | null;
  /** ISO 2-letter country code (e.g. `IE`, `US`). */
  code?: string | null;
}

/** A role's description block — Hirehive exposes both rendered HTML and a plain-text form. */
export interface HirehiveDescription {
  /** Rendered HTML body. */
  html?: string | null;
  /** Plain-text body. */
  text?: string | null;
}

/** A role's category block (`category: { id, name }`), used as the department label. */
export interface HirehiveCategory {
  /** Stable category id (e.g. `cat_cQIJoW`). */
  id?: string | null;
  /** Category display name (e.g. `HR`, `Engineering`). */
  name?: string | null;
}

/** A role's employment-type block (`type: { type, name }`). */
export interface HirehiveType {
  /** Machine token (e.g. `FullTime`, `PartTime`, `Contract`, `Remote`). */
  type?: string | null;
  /** Display label (e.g. `Full Time`). */
  name?: string | null;
}

/** A role's experience block (`experience: { type, name }`). */
export interface HirehiveExperience {
  /** Machine token (e.g. `EntryLevel`). */
  type?: string | null;
  /** Display label (e.g. `Entry Level`). */
  name?: string | null;
}

/** A role's language block (`language: { name, code }`). */
export interface HirehiveLanguage {
  /** Language display name (e.g. `English`). */
  name?: string | null;
  /** Language / locale code (e.g. `en-US`). */
  code?: string | null;
}

/**
 * A single role as returned in the public feed's `items[]`. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface HirehiveJobItem {
  /** Stable string role id — the ATS id (e.g. `job_QxZUlo`). */
  id?: string | null;
  /** Role display title. */
  title?: string | null;
  /** Free-text city / location line (e.g. `San Francisco`). */
  location?: string | null;
  /** Short state / region code (e.g. `CA`), when present. */
  state_code?: string | null;
  /** Structured country (name + ISO code). */
  country?: HirehiveCountry | null;
  /** Free-text salary line, when present. */
  salary?: string | null;
  /** Role description (HTML + plain text). */
  description?: HirehiveDescription | null;
  /** Category / department block. */
  category?: HirehiveCategory | null;
  /** Employment-type block. */
  type?: HirehiveType | null;
  /** Experience-level block. */
  experience?: HirehiveExperience | null;
  /** Language block. */
  language?: HirehiveLanguage | null;
  /** ISO publish timestamp. */
  published_date?: string | null;
  /** ISO creation timestamp. */
  created_date?: string | null;
  /** Canonical public detail / apply URL (`{origin}/{title}-{location}-{shortId}`). */
  hosted_url?: string | null;
}

/**
 * The feed envelope's `meta` block carrying pagination state. Modelled defensively — the
 * adapter reads `has_next_page` to decide whether to drain another page.
 */
export interface HirehiveMeta {
  /** Current page (1-based). */
  page?: number | null;
  /** Page size echoed back. */
  page_size?: number | null;
  /** Total published roles across all pages. */
  total_items?: number | null;
  /** Total page count. */
  total_pages?: number | null;
  /** True when a further page exists. */
  has_next_page?: boolean | null;
  /** True when a prior page exists. */
  has_previous_page?: boolean | null;
}

/** The feed envelope's `links` block (relative pagination URLs). */
export interface HirehiveLinks {
  /** First-page link. */
  first?: string | null;
  /** Last-page link. */
  last?: string | null;
  /** Next-page link (null on the last page). */
  next?: string | null;
  /** Previous-page link (null on the first page). */
  previous?: string | null;
}

/**
 * The top-level public feed envelope `{ meta, links, items }`. Only the path the adapter
 * walks is modelled; `items` is narrowed to an array at parse time.
 */
export interface HirehiveJobsResponse {
  /** Pagination metadata. */
  meta?: HirehiveMeta | null;
  /** Pagination links. */
  links?: HirehiveLinks | null;
  /** The open roles on this page. */
  items?: HirehiveJobItem[] | null;
}

/**
 * Normalised view of a single Hirehive role, ready to map to a JobPostDto.
 */
export interface HirehiveJob {
  /** Stable ATS id (the role `id`, e.g. `job_QxZUlo`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `hosted_url`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (de-slugified tenant token — the feed carries no brand). */
  companyName?: string | null;

  /** Structured location parts derived from the role's location / state / country. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's category name. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`). */
  employmentType?: string | null;

  /** Posted date — parsed from `published_date`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
