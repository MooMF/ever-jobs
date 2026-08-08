/**
 * TypeScript interfaces for the Gupy public careers surface.
 *
 * Gupy tenant career sites (`{tenant}.gupy.io`) are server-rendered Next.js apps whose
 * landing page embeds the full open-roles set directly in the HTML inside the Next.js
 * data island `<script id="__NEXT_DATA__" type="application/json">{ … }</script>`. The
 * adapter extracts that JSON island and reads `props.pageProps.jobs`. The interfaces
 * below describe the subset of that wire shape the adapter reads plus the normalised
 * internal role assembled from it. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant or future-shape drift never
 * breaks the parser.
 */

/**
 * The structured address embedded in a role's `workplace`. Gupy roles carry a single
 * structured address rather than a free-text location line.
 */
export interface GupyAddress {
  /** Country name (e.g. `Brasil`). */
  country?: string | null;
  /** Full state / region name (e.g. `Paraná`). */
  state?: string | null;
  /** Short state code (e.g. `PR`). */
  stateShortName?: string | null;
  /** City name (e.g. `Rio Azul`). */
  city?: string | null;
  /** District / neighbourhood, when present. */
  district?: string | null;
}

/**
 * A role's workplace block: the structured `address` plus a `workplaceType` token
 * (`on-site` / `hybrid` / `remote`) used to flag remote roles.
 */
export interface GupyWorkplace {
  /** Structured location for the role. */
  address?: GupyAddress | null;
  /** Workplace arrangement (`on-site` / `hybrid` / `remote`). */
  workplaceType?: string | null;
}

/**
 * A single role as embedded in the SSR `__NEXT_DATA__` island at
 * `props.pageProps.jobs`. Only the fields the adapter consumes are modelled; all are
 * optional and defensively narrowed.
 */
export interface GupyJobItem {
  /** Numeric role id — the stable ATS id and the final segment of `/jobs/{id}`. */
  id?: number | string | null;
  /** Role display title. */
  title?: string | null;
  /** Vacancy type token (e.g. `vacancy_type_effective`). */
  type?: string | null;
  /** Department / organisational-unit label, when present. */
  department?: string | null;
  /** Structured workplace (address + workplaceType). */
  workplace?: GupyWorkplace | null;
  /** True when the role supports Gupy's one-click "quick apply" flow. */
  quickApply?: boolean | null;
  /** ISO publish timestamp, when present (some boards include it). */
  publishedDate?: string | null;
  /** ISO application-deadline timestamp, when present. */
  applicationDeadline?: string | null;
  /** Plain / HTML role description, when present (richer boards include it). */
  description?: string | null;
}

/**
 * The tenant's career-page metadata embedded alongside the jobs. The adapter reads
 * `name` as the company display brand (the per-role records carry no brand name).
 */
export interface GupyCareerPage {
  /** Internal career-page id. */
  id?: number | string | null;
  /** Tenant display brand name (e.g. `Sicredi`). */
  name?: string | null;
  /** Publication name (alternate brand label). */
  publicationName?: string | null;
  /** Tenant sub-domain label. */
  subdomain?: string | null;
}

/**
 * The `props.pageProps` block of the Next.js data island carrying the open-roles board.
 * Modelled defensively — the adapter narrows `jobs` to an array.
 */
export interface GupyPageProps {
  /** Tenant sub-domain label. */
  subdomain?: string | null;
  /** Tenant career-page metadata (brand name, ids). */
  careerPage?: GupyCareerPage | null;
  /** The open roles for the tenant. */
  jobs?: GupyJobItem[] | null;
  /** Canonical career-site URL (e.g. `https://sicredi.gupy.io/`). */
  canonicalUrl?: string | null;
}

/**
 * The top-level Next.js data island shape. Only the path the adapter walks
 * (`props.pageProps`) is modelled.
 */
export interface GupyNextData {
  props?: {
    pageProps?: GupyPageProps | null;
  } | null;
}

/**
 * Normalised view of a single Gupy role, ready to map to a JobPostDto.
 */
export interface GupyJob {
  /** Stable ATS id (the role `id`). */
  atsId: string;

  /** Absolute public detail URL (the canonical career-site `/jobs/{id}` page). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (the career-page brand, else the de-slugified slug). */
  companyName?: string | null;

  /** Structured location parts derived from the role's workplace address. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (when the board exposes one), else null. */
  descriptionHtml?: string | null;

  /** Department / organisational-unit label. */
  department?: string | null;

  /** Posted date — parsed from `publishedDate`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
