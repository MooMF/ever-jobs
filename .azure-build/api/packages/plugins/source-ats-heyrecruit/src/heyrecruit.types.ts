/**
 * TypeScript interfaces for the Heyrecruit embedded job record.
 *
 * Heyrecruit's public careers overview embeds the full job object on each tile
 * via `onclick="jobClickEventListener({...})"`. The embedded JSON mirrors the
 * shape returned by the platform's `jobs/index` REST endpoint, so field names
 * are `snake_case`. A handful of `camelCase` aliases are modelled defensively so
 * minor cross-tenant / version drift never breaks the parser.
 *
 * Verified wire shape (live 2026-06-03, `bodenseetherme.heyrecruit.de`):
 *
 *   {
 *     "id": 91424,
 *     "internal_title": "...",
 *     "publication_date": null,
 *     "last_modification": "2026-06-01T08:19:13+02:00",
 *     "default_language_id": 1,
 *     "company_location_jobs": [
 *       {
 *         "id": 496271,
 *         "job_id": 91424,
 *         "company_location_id": 15266,
 *         "publish_date": "2026-06-01T14:51:06+02:00",
 *         "active": true,
 *         "company_location": {
 *           "title": "Überlingen - Bodensee",
 *           "city": "Überlingen",
 *           "state": "Baden-Württemberg",
 *           "country": "Deutschland",
 *           "street": "Bahnhofstraße",
 *           "postal_code": "88662"
 *         }
 *       }
 *     ],
 *     "job_strings": [
 *       {
 *         "language_id": 1,
 *         "title": "Rettungsschwimmer (m/w/d) ",
 *         "subtitle": "Wir suchen ab sofort:",
 *         "description": "<h2>…</h2><p>…</p>",
 *         "employment": "Vollzeit",
 *         "department": "Bad / Sauna"
 *       }
 *     ]
 *   }
 */

/**
 * A per-language localised string bundle for a job. Heyrecruit carries one entry
 * per configured portal language; `language_id === 1` is the German default.
 */
export interface HeyrecruitJobString {
  /** Localised-string row id. */
  id?: number | string | null;
  /** Parent job id. */
  job_id?: number | string | null;
  /** Language id this bundle is written in (1 = German default). */
  language_id?: number | string | null;

  /** Job display title. */
  title?: string | null;
  /** Optional sub-title / strapline. */
  subtitle?: string | null;

  /** HTML job description body. */
  description?: string | null;

  /** Comma-separated employment types (e.g. "Vollzeit, Teilzeit"). */
  employment?: string | null;

  /** Department / functional area label (e.g. "Bad / Sauna"). */
  department?: string | null;
}

/** Structured address of a company location. */
export interface HeyrecruitCompanyLocation {
  /** Display title for the location (often "City - Region"). */
  title?: string | null;
  /** City / locality. */
  city?: string | null;
  /** State / region (e.g. "Baden-Württemberg"). */
  state?: string | null;
  /** Country (e.g. "Deutschland"). */
  country?: string | null;
  /** Street name. */
  street?: string | null;
  /** Street number. */
  street_number?: string | null;
  /** Postal code. */
  postal_code?: string | null;
}

/** A job ↔ location join row carried in `company_location_jobs[]`. */
export interface HeyrecruitCompanyLocationJob {
  /** Join-row id. */
  id?: number | string | null;
  /** Parent job id. */
  job_id?: number | string | null;
  /** Company-location id — the `&location=` query param on the detail URL. */
  company_location_id?: number | string | null;
  /** ISO-8601 publish timestamp for this location's posting. */
  publish_date?: string | null;
  /** Whether this location's posting is live. */
  active?: boolean | null;
  /** The structured location record. */
  company_location?: HeyrecruitCompanyLocation | null;
}

/**
 * A single open position as embedded on a job tile (mirrors `jobs/index`).
 * Field names follow the wire (`snake_case`); a few aliases guard drift.
 */
export interface HeyrecruitJob {
  /** Stable numeric job id — used as the ATS id. */
  id?: number | string | null;

  /** Internal (back-office) job title; not shown to candidates. */
  internal_title?: string | null;

  /** ISO-8601 publication timestamp (often null; falls back to publish_date). */
  publication_date?: string | null;
  /** ISO-8601 last-modification timestamp. */
  last_modification?: string | null;

  /** Default localisation language id (1 = German). */
  default_language_id?: number | string | null;

  /** Per-language string bundles; entry 0 is the default-language copy. */
  job_strings?: HeyrecruitJobString[] | null;

  /** Job ↔ location join rows (one per advertised location). */
  company_location_jobs?: HeyrecruitCompanyLocationJob[] | null;
}

/**
 * A parsed overview tile: the embedded job record plus the visible tile text
 * harvested as a layered fallback when the embedded JSON is absent / malformed.
 */
export interface HeyrecruitTile {
  /** The embedded job record (primary source), or null when unavailable. */
  job: HeyrecruitJob | null;
  /** Visible tile title text (fallback for `job_strings[0].title`). */
  titleText: string | null;
  /** Detail-page URL parsed from the tile anchor (fallback for id/location). */
  detailUrl: string | null;
}
