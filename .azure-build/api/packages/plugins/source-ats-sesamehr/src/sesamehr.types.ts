/**
 * TypeScript interfaces for the Sesame HR public careers surface.
 *
 * Sesame HR tenant career portals (`app.sesametime.com/jobs/{company}/…`) are backed by a
 * public, anonymous JSON feed at
 * `GET https://back-{region}.sesametime.com/api/v3/companies/{company}/public-vacancies?page={n}`,
 * which returns an envelope `{ data, meta }`. The backend region is first resolved via the
 * anonymous company finder `GET login.sesametime.com/private/login-finder/v1/company/{company}`
 * → `{ data: { region } }`. The adapter GETs the feed, drains pages via `meta.lastPage`, and
 * reads `data[]`. The interfaces below describe the subset of that wire shape the adapter
 * reads plus the normalised internal role assembled from it. Everything the adapter reads is
 * optional and defensively narrowed at parse time, so cross-tenant or future-shape drift
 * never breaks the parser.
 */

/**
 * Region-finder response (`{ data: { region } }`). Used to select the backend host. Modelled
 * defensively — a missing region falls back to the default backend.
 */
export interface SesameHrRegionResponse {
  /** Carries the region token (e.g. `EU1`). */
  data?: SesameHrRegionData | null;
}

/** The `data` block of the region-finder response. */
export interface SesameHrRegionData {
  /** Region token (e.g. `EU1`), mapped to `back-{region}.sesametime.com`. */
  region?: string | null;
}

/**
 * A role's category block (`category: { id, name }`), used as the department label.
 */
export interface SesameHrCategory {
  /** Stable category UUID. */
  id?: string | null;
  /** Category display name (e.g. `Comercial`, `Engineering`). */
  name?: string | null;
}

/**
 * A role's schedule-type block (`scheduleType: { id, name }`), used as the employment-type
 * label when present (e.g. `Jornada completa` / `Full time`).
 */
export interface SesameHrScheduleType {
  /** Stable schedule-type UUID. */
  id?: string | null;
  /** Schedule-type display name (e.g. `Jornada completa`). */
  name?: string | null;
}

/**
 * A single role as returned in the public feed's `data[]`. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface SesameHrVacancy {
  /** Stable UUID role id — the ATS id (e.g. `599a9c9f-dbac-409b-b890-c63e71d9dd2f`). */
  id?: string | null;
  /** Owning company UUID (not surfaced; present in the wire shape). */
  companyId?: string | null;
  /** Role display title. */
  name?: string | null;
  /** Rendered HTML role description body. */
  description?: string | null;
  /** Employment-contract token (e.g. `full_time`, `part_time`). */
  contractType?: string | null;
  /** Lifecycle status (e.g. `open`). */
  status?: string | null;
  /** Whether the role is published to the public portal. */
  public?: boolean | null;
  /** ISO-ish publish timestamp (e.g. `2026-05-27 09:15:31`). */
  openedAt?: string | null;
  /** ISO-ish creation timestamp. */
  createdAt?: string | null;
  /** Free-text city line (e.g. `Barcelona`). */
  addressCity?: string | null;
  /** Free-text state / region line, when present. */
  addressState?: string | null;
  /** ISO-2 country code (e.g. `ES`), when present. */
  addressCountry?: string | null;
  /** Street address line, when present. */
  addressLine1?: string | null;
  /** Postal code, when present. */
  addressZip?: string | null;
  /** Work modality token (`remoteVacancyModality` / `hybridVacancyModality` / `onsiteVacancyModality`). */
  modality?: string | null;
  /** Category / department block. */
  category?: SesameHrCategory | null;
  /** Schedule-type block (used as employment type). */
  scheduleType?: SesameHrScheduleType | null;
}

/**
 * The feed envelope's `meta` block carrying pagination state. Modelled defensively — the
 * adapter reads `currentPage` / `lastPage` to decide whether to drain another page.
 */
export interface SesameHrMeta {
  /** Current page (1-based). */
  currentPage?: number | null;
  /** Last page number (drain while `currentPage < lastPage`). */
  lastPage?: number | null;
  /** Total published roles across all pages. */
  total?: number | null;
  /** Page size echoed back. */
  perPage?: number | null;
}

/**
 * The top-level public feed envelope `{ data, meta }`. Only the path the adapter walks is
 * modelled; `data` is narrowed to an array at parse time.
 */
export interface SesameHrVacanciesResponse {
  /** The open roles on this page. */
  data?: SesameHrVacancy[] | null;
  /** Pagination metadata. */
  meta?: SesameHrMeta | null;
}

/**
 * Normalised view of a single Sesame HR role, ready to map to a JobPostDto.
 */
export interface SesameHrJob {
  /** Stable ATS id (the role `id` UUID). */
  atsId: string;

  /** Absolute public detail URL (`app.sesametime.com/jobs/{company}/{id}`). */
  url: string;

  /** Absolute public apply URL (`app.sesametime.com/jobs/{company}/{id}/apply`). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (de-slugified company token — the feed carries no brand). */
  companyName?: string | null;

  /** Structured location parts derived from the role's address fields. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's category name. */
  department?: string | null;

  /** Employment-type display label (schedule-type name, else contract-type token). */
  employmentType?: string | null;

  /** Posted date — parsed from `openedAt` (else `createdAt`), when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
