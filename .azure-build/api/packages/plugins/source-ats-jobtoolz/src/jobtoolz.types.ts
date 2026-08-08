/**
 * TypeScript interfaces for the Jobtoolz public careers surface.
 *
 * Jobtoolz tenant jobsites (`{tenant}.jobtoolz.com/{locale}`) are thin server-rendered
 * shells whose open-roles board embeds the full vacancy set directly in the HTML as the
 * first argument of a `window.jobComponent([ … ], …)` bootstrap call (wired through an
 * Alpine.js `x-data` attribute, so the JSON text is HTML-entity-encoded). The adapter
 * extracts, HTML-decodes, and parses that embedded JSON array. The interfaces below
 * describe the subset of the vacancy wire shape the adapter reads plus the normalised
 * internal role assembled from it. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant or future-shape drift never breaks
 * the parser.
 */

/**
 * The `filters` sub-object embedded on each vacancy: facet ids used by the board's
 * client-side filter UI. The adapter does not filter on these, but reads `types[]` as a
 * structured fallback for the employment-type label.
 */
export interface JobtoolzVacancyFilters {
  /** Category / type filter ids the role belongs to. */
  filterIds?: number[] | null;
  /** Location filter id. */
  locationId?: number | string | null;
  /** Normalised employment-type tokens (e.g. `fulltime`, `parttime`). */
  types?: string[] | null;
}

/**
 * A single vacancy as embedded in the open-roles board array
 * (`window.jobComponent([ … ], …)`). Only the fields the adapter consumes are modelled;
 * all are optional and defensively narrowed.
 */
export interface JobtoolzVacancy {
  /** Numeric vacancy id — the stable per-role ATS id. */
  id?: number | string | null;
  /** Job display title. */
  title?: string | null;
  /** CTA button label (e.g. `bekijk vacature`) — ignored for the job body. */
  button?: string | null;
  /**
   * Canonical public detail URL for the role (e.g.
   * `https://{tenant}.jobtoolz.com/{locale}/{title-slug}`). Doubles as the apply URL.
   */
  url?: string | null;
  /** Role banner image URL — ignored. */
  image_url?: string | null;
  /** Free-text location string, when present (e.g. `Sint-Andries`). */
  location?: string | null;
  /** Free-text employment-type label, when present (e.g. `Voltijds, Deeltijds`). */
  types?: string | null;
  /** Structured filter facets (category / location / employment-type ids). */
  filters?: JobtoolzVacancyFilters | null;
}

/**
 * The embedded board payload: the bracketed array of vacancies that is the first argument
 * of `window.jobComponent([ … ], …)`. Modelled as a plain array; the adapter narrows the
 * parsed value to an array defensively.
 */
export type JobtoolzVacancyBatch = JobtoolzVacancy[];

/**
 * Normalised view of a single Jobtoolz role, ready to map to a JobPostDto.
 */
export interface JobtoolzJob {
  /** Stable ATS id (the vacancy numeric `id`). */
  atsId: string;

  /** Absolute public detail URL (the canonical jobsite job page). */
  url: string;

  /** Absolute public apply URL (the same canonical jobsite page). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the board carries no brand name). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used for remote detection. */
  locationText?: string | null;

  /** Employment-type label (from the free-text `types` field), when present. */
  employmentType?: string | null;

  /** Department / organisational-unit label — Jobtoolz boards carry none at list level. */
  department?: string | null;

  /** Posted date — Jobtoolz boards carry no list-level date, so this is null. */
  datePosted?: string | null;

  /** True when the role advertises remote / hybrid working. */
  isRemote?: boolean | null;
}
