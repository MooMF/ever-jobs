/**
 * TypeScript interfaces for the HiBob ("Bob") public careers / Hiring API surface.
 *
 * HiBob's careers page (`{tenant}.careers.hibob.com/jobs`) is a client-rendered SPA
 * backed by the documented, anonymous Hiring API on `api.hibob.com`: an
 * active-job-ads search (`POST /v1/hiring/job-ads/search`) and a per-role detail
 * object (`GET /v1/hiring/job-ads/{id}`). Each role is wrapped in a `jobAd` object
 * (the API addresses its fields with the dotted `jobAd/…` notation, e.g.
 * `jobAd/applyUrl`). The interfaces below model the wire shapes the adapter
 * consumes. Because the docs portal gates the full schema, every field the adapter
 * reads is optional and defensively narrowed at parse time, so cross-tenant or
 * future-version drift never breaks the parser.
 */

/**
 * A single HiBob job ad. The API nests the ad's fields under a `jobAd` object; the
 * fields below are the ones the adapter consumes. Names mirror the documented
 * `jobAd/…` accessors; everything is optional and defensively narrowed.
 */
export interface HiBobJobAd {
  /** Opaque job-ad id (a UUID) — used as the ATS id and the detail-endpoint key. */
  id?: string | number | null;
  /** Job display title. */
  title?: string | null;
  /** Job-ad name, used as a title fallback on some tenants. */
  name?: string | null;
  /** Full job-ad body (HTML). */
  description?: string | null;
  /** Primary location string (e.g. "London, UK", "Remote"). */
  location?: string | null;
  /** Structured city / state / country, when the tenant supplies them. */
  city?: string | null;
  state?: string | null;
  country?: string | null;
  /** Department / team label, when categorised. */
  department?: string | null;
  team?: string | null;
  /** Employment-type token (e.g. `Full-time`, `Part-time`, `Contract`, `Internship`). */
  employmentType?: string | null;
  /** Alternative employment-type key seen on some tenants. */
  jobType?: string | null;
  /** Explicit remote flag, when the API sets one. */
  remote?: boolean | null;
  /** Workplace mode (`Remote` / `Onsite` / `Hybrid`), when present. */
  workplaceType?: string | null;
  /** Canonical public apply URL (`{tenant}.careers.hibob.com/jobs/{id}/apply`). */
  applyUrl?: string | null;
  /** Canonical public detail URL (`{tenant}.careers.hibob.com/jobs/{id}`). */
  url?: string | null;
  /** ISO timestamp the ad was created / published. */
  createdAt?: string | null;
  /** Alternative publish-date key seen on some tenants. */
  publishedAt?: string | null;
}

/** An entry in the job-ads search response; the ad may be nested under `jobAd`. */
export interface HiBobJobAdEntry {
  /** Nested ad object (the documented `jobAd/…` shape). */
  jobAd?: HiBobJobAd | null;
  /** Some tenants surface the id at the entry level. */
  id?: string | number | null;
}

/**
 * The envelope returned by `POST /v1/hiring/job-ads/search`. The active ads may be
 * carried under `jobAds`, `results`, or `items` depending on tenant / version, so
 * the adapter probes each defensively.
 */
export interface HiBobJobAdsSearchResponse {
  /** Active job ads (primary key). */
  jobAds?: HiBobJobAdEntry[] | null;
  /** Alternative result key. */
  results?: HiBobJobAdEntry[] | null;
  /** Alternative result key. */
  items?: HiBobJobAdEntry[] | null;
  /** Total active-ad count, when reported. */
  total?: number | null;
}

/**
 * The per-role detail envelope returned by `GET /v1/hiring/job-ads/{id}`. The ad
 * may be nested under `jobAd` or returned at the top level, so both are tolerated.
 */
export interface HiBobJobAdDetailResponse {
  /** Nested ad object. */
  jobAd?: HiBobJobAd | null;
}

/**
 * Normalised view of a single HiBob role, assembled from its search entry and its
 * (optional) fetched detail object.
 */
export interface HiBobJob {
  /** Opaque job-ad id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail URL (`{tenant}.careers.hibob.com/jobs/{id}`). */
  url: string;

  /** Absolute public apply URL (`{tenant}.careers.hibob.com/jobs/{id}/apply`). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the API carries no brand name). */
  companyName?: string | null;

  /** Full job-ad body as HTML (from the detail object, else the list entry). */
  descriptionHtml?: string | null;

  /** Structured location parts. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label. */
  employmentType?: string | null;

  /** Department label, when present. */
  department?: string | null;

  /** Posted date — parsed to YYYY-MM-DD. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
