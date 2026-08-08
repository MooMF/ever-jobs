/**
 * TypeScript interfaces for the Beamery public careers surface.
 *
 * Beamery careers sites are server-rendered and expose no confirmed anonymous JSON jobs feed
 * (see `beamery.constants.ts` — the candidate-facing `/api/...` routes are gated and the only
 * structured API is the authenticated `frontier.beamery.com` REST API). This adapter probes a
 * best-effort candidate-facing JSON route and degrades to an empty result when none is served.
 *
 * Because the exact anonymous wire shape is NOT confirmed live, the interfaces below model a
 * plausible Beamery-style envelope `{ data | results | jobs | vacancies, meta }` defensively:
 * EVERY field the adapter reads is optional / nullable and narrowed at parse time, and the
 * parser tolerates several common key spellings (`id`/`uuid`, `title`/`name`,
 * `description`/`descriptionHtml`, `location`/`locations[]`, etc.) so shape drift — or a tenant
 * that does serve a feed in a slightly different dialect — never breaks the parser.
 */

/** A role's structured location block, modelled across the common Beamery spellings. */
export interface BeameryLocation {
  /** Free-text location line (e.g. `London, UK`). */
  name?: string | null;
  /** City component, when split out. */
  city?: string | null;
  /** State / region component, when split out. */
  region?: string | null;
  /** State / region (alternate spelling). */
  state?: string | null;
  /** Country display name (e.g. `United Kingdom`). */
  country?: string | null;
  /** ISO 2-letter country code (e.g. `GB`), when present. */
  countryCode?: string | null;
  /** True when the location block flags a fully-remote role, when present. */
  remote?: boolean | null;
}

/** A role's department / team block (used as the department label). */
export interface BeameryDepartment {
  /** Stable department id, when present. */
  id?: string | null;
  /** Department / team display name (e.g. `Engineering`). */
  name?: string | null;
}

/**
 * A single role as returned by a best-effort Beamery careers JSON route. Only the fields the
 * adapter consumes are modelled; ALL are optional and defensively narrowed, and several
 * alternate key spellings are accepted so the parser tolerates shape / dialect drift.
 */
export interface BeameryJobItem {
  /** Stable role id — the ATS id. Beamery role pages key off a UUID. */
  id?: string | null;
  /** Role id (alternate spelling). */
  uuid?: string | null;
  /** Role id (alternate spelling). */
  jobId?: string | null;

  /** Role display title. */
  title?: string | null;
  /** Role display title (alternate spelling). */
  name?: string | null;

  /** URL / path slug used in the canonical detail URL `{host}/jobs/job/{uuid}-{slug}/`. */
  slug?: string | null;

  /** Canonical public detail / apply URL, when the feed supplies it directly. */
  url?: string | null;
  /** Canonical public detail URL (alternate spelling). */
  jobUrl?: string | null;
  /** Apply URL, when the feed supplies it separately. */
  applyUrl?: string | null;

  /** Rendered HTML description body. */
  description?: string | null;
  /** Rendered HTML description body (alternate spelling). */
  descriptionHtml?: string | null;
  /** Plain-text description body, when the feed supplies it separately. */
  descriptionText?: string | null;

  /** Free-text location line. */
  location?: string | null;
  /** Structured location block. */
  locationObject?: BeameryLocation | null;
  /** Multiple structured locations, when a role spans sites. */
  locations?: BeameryLocation[] | null;

  /** Department / team block. */
  department?: BeameryDepartment | null;
  /** Department / team display name (flat spelling). */
  departmentName?: string | null;
  /** Team display name (alternate flat spelling). */
  team?: string | null;

  /** Employment-type display label (e.g. `Full Time`, `Contract`). */
  employmentType?: string | null;
  /** Employment-type display label (alternate spelling). */
  jobType?: string | null;
  /** Employment-type display label (alternate spelling). */
  type?: string | null;

  /** True when the role is flagged fully-remote at the top level, when present. */
  remote?: boolean | null;

  /** ISO publish timestamp. */
  publishedDate?: string | null;
  /** ISO publish timestamp (alternate spelling). */
  publishedAt?: string | null;
  /** ISO creation timestamp (alternate spelling). */
  createdAt?: string | null;
  /** Posted date (alternate spelling). */
  postedDate?: string | null;
}

/**
 * Pagination metadata block, modelled defensively across the common spellings the adapter
 * checks to decide whether to drain another page.
 */
export interface BeameryMeta {
  /** Current page (1-based), when present. */
  page?: number | null;
  /** Page size echoed back, when present. */
  pageSize?: number | null;
  /** Total roles across all pages, when present. */
  total?: number | null;
  /** Total roles across all pages (alternate spelling). */
  totalCount?: number | null;
  /** Total page count, when present. */
  totalPages?: number | null;
  /** True when a further page exists, when present. */
  hasNextPage?: boolean | null;
  /** True when a further page exists (alternate spelling). */
  hasMore?: boolean | null;
}

/**
 * The top-level best-effort feed envelope. Beamery exposes no confirmed anonymous feed, so
 * the adapter accepts the role array under any of the common keys (`data` / `results` /
 * `jobs` / `vacancies` / `items`), a bare top-level array, and an optional `meta` block.
 */
export interface BeameryJobsResponse {
  /** Roles under a `data` key. */
  data?: BeameryJobItem[] | null;
  /** Roles under a `results` key. */
  results?: BeameryJobItem[] | null;
  /** Roles under a `jobs` key. */
  jobs?: BeameryJobItem[] | null;
  /** Roles under a `vacancies` key. */
  vacancies?: BeameryJobItem[] | null;
  /** Roles under an `items` key. */
  items?: BeameryJobItem[] | null;
  /** Pagination metadata, when present. */
  meta?: BeameryMeta | null;
}

/**
 * Normalised view of a single Beamery role, ready to map to a JobPostDto.
 */
export interface BeameryJob {
  /** Stable ATS id (the role UUID / id). */
  atsId: string;

  /** Absolute public detail URL (`{origin}/jobs/job/{uuid}-{slug}/`). */
  url: string;

  /** Absolute public apply URL (the detail page hosts the apply flow inline). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (de-slugified tenant token — the feed carries no brand). */
  companyName?: string | null;

  /** Structured location parts derived from the role's location block(s). */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's department / team. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`). */
  employmentType?: string | null;

  /** Posted date — parsed from the publish timestamp, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
