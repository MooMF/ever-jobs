/**
 * TypeScript interfaces for the Vincere Instant Job Board AJAX search API.
 *
 * The search endpoint (`POST /careers/ajax/search-jobs`) returns a JSON
 * envelope `{ items: VincereJob[], total, more, facets, html }`. All field
 * names mirror the real wire shape, which is `snake_case` for nested objects
 * and primitive scalars; the root item fields use a mix of `snake_case` and
 * `camelCase`. Both spellings are modelled defensively so minor cross-tenant
 * or future version drift never breaks the parser.
 *
 * Wire shape verified live against `nordicjobsworldwide.vincere.io` on
 * 2026-06-03.
 */

/** Embedded location object on a job item. */
export interface VincereLocation {
  id?: number | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  /** Full display label, e.g. "Lisbon, Portugal". */
  location_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  post_code?: string | null;
  /** ISO 3166-1 alpha-2 country code, e.g. "PT". */
  country_code?: string | null;
  /** Full country name, e.g. "Portugal". */
  country?: string | null;
  longitude?: number | null;
  latitude?: number | null;
}

/** A single open position as returned inside the `items` array. */
export interface VincereJob {
  /** Stable numeric job id — used as the ATS id. */
  id?: number | string | null;

  /** Primary job title. */
  job_title?: string | null;
  /** camelCase alias occasionally seen in some tenant responses. */
  jobTitle?: string | null;

  /** Structured location object. */
  location?: VincereLocation | null;

  /** HTML job description (the primary description field in the listing response). */
  public_description?: string | null;
  /** Short summary HTML sometimes used when `public_description` is absent. */
  job_summary?: string | null;

  /**
   * Canonical job type string. Observed values: "PERMANENT", "CONTRACT",
   * "TEMPORARY". Maps to the `department` / job-type field.
   */
  job_type?: string | null;

  /**
   * Employment type string. Observed values: "FULL_TIME", "PART_TIME",
   * "CONTRACT", "CASUAL". Used for remote / employment-type detection.
   */
  employment_type?: string | null;

  /** ISO-8601 publish date, e.g. "2026-06-02T13:12:50.819Z". */
  published_date?: string | null;
  /** Open-date alternative; populated on some contract roles. */
  open_date?: string | null;
  /** Close/expiry date. */
  close_date?: string | null;

  /** Salary type string, e.g. "MONTHLY", "ANNUAL". */
  salary_type?: string | null;

  /** Owner/recruiter details (often null in anonymous boards). */
  owners?: unknown | null;

  /** Industry tag (may be null). */
  industry?: { id?: number | null; name?: string | null } | null;

  /** Functional expertise tags. */
  expertises?: Array<{ id?: number | null; name?: string | null }> | null;
}

/** The AJAX search endpoint response envelope. */
export interface VincereSearchResponse {
  /** Structured job item objects — the primary data feed. */
  items?: VincereJob[] | null;
  /** Total open-role count for this tenant and search query (drives pagination). */
  total?: number | null;
  /** `true` when more pages are available beyond the current one. */
  more?: boolean | null;
  /** Pre-rendered HTML fragment (not used by this adapter). */
  html?: string | null;
  /** Aggregation facets (industry, location counts, etc. — not used). */
  facets?: unknown | null;
}
