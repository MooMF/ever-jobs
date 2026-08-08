/**
 * TypeScript interfaces for the Flatchr public career-site JSON listing.
 *
 * Wire shape returned by `GET https://careers.flatchr.io/company/{slug}.json`.
 * The top-level response is `{ items: FlatchrListItem[] }`; each item wraps a
 * full `FlatchrVacancy` record under `vacancy`. Field names mirror the real
 * wire shape (snake_case as served by the API).
 *
 * All fields are optional/nullable to tolerate sparse or tenant-varying
 * responses — Flatchr omits or nulls many fields depending on the tenant's
 * configuration and the individual vacancy.
 *
 * Verified live against `careers.flatchr.io/company/flatchr.json` on
 * 2026-06-03.
 */

/** Structured postal address embedded on a vacancy (`vacancy.address`). */
export interface FlatchrAddress {
  /** City / town. Example: `"Boulogne-Billancourt"`. */
  locality?: string | null;
  /** Street route name. Example: `"Rue Marcel Dassault"`. */
  route?: string | null;
  /** Street number. Example: `"79"`. */
  street_number?: string | null;
  /** Postal code. Example: `"92100"`. */
  postal_code?: string | null;
  /** Region / state. Example: `"Île-de-France"`. */
  administrative_area_level_1?: string | null;
  /** Department / county. Example: `"Hauts-de-Seine"`. */
  administrative_area_level_2?: string | null;
  /** Country name. Example: `"France"`. */
  country?: string | null;
  /**
   * Fully formatted single-line address.
   * Example: `"79 Rue Marcel Dassault, 92100 Boulogne-Billancourt, France"`.
   */
  formatted_address?: string | null;
  /** Latitude as a string. */
  location_lat?: string | null;
  /** Longitude as a string. */
  location_lng?: string | null;
}

/** Company object embedded on a vacancy (`vacancy.company`). */
export interface FlatchrCompany {
  id?: number | string | null;
  /** Human-readable company name. Example: `"Flatchr"`. Preferred company name. */
  name?: string | null;
  /** Tenant slug. Example: `"flatchr"`. */
  slug?: string | null;
  /** Free-text company description (HTML). */
  description?: string | null;
  /** Company website. Example: `"http://www.flatchr.io"`. */
  web?: string | null;
  /** Company logo URL. */
  logo?: string | null;
  /** Activity / industry label. */
  activity?: string | null;
  /** Structured company address (same shape as a vacancy address). */
  address?: FlatchrAddress | null;
}

/**
 * A single vacancy record (`item.vacancy`). The listing endpoint embeds the
 * full record — including the multi-part HTML description — so no per-vacancy
 * detail fetch is required.
 */
export interface FlatchrVacancy {
  /** Opaque alphanumeric vacancy id. Example: `"Wy3EOp2JolLp1KMq"`. */
  id?: string | null;
  /** Numeric vacancy id. Example: `655446`. */
  vacancy_id?: number | null;
  /**
   * URL-friendly vacancy slug (carries the vacancy id as its leading token).
   * Example: `"wy3eop2jollp1kmq-account-executive-_-saas-rh-h-f"`.
   * Used to build the public job-detail page URL.
   */
  slug?: string | null;
  /** Internal reference code. Example: `"AE sénior 06 2026"`. */
  reference?: string | null;
  /** Job title. Example: `"Account executive _ Editeur de logiciel RH H/F"`. */
  title?: string | null;
  /** Primary HTML "about" description block. */
  description?: string | null;
  /** HTML "mission" / responsibilities block. */
  mission?: string | null;
  /** HTML "profile" / requirements block. */
  profile?: string | null;
  /** Contract / employment type label. Example: `"CDI"`. */
  contract_type?: string | null;
  /** Function / job-family label. Example: `"Commercial conseil"`. */
  metier?: string | null;
  /** Activity / sector label. Example: `"Internet"`. */
  activity?: string | null;
  /** Minimum salary (numeric). Example: `45000`. */
  salary?: number | null;
  /** Maximum salary (numeric). Example: `80000`. */
  salary_max?: number | null;
  /** Salary currency. Example: `"EUR"`. */
  currency?: string | null;
  /**
   * Remote-work indicator. An enum-ish string; `"notime"` means on-site only.
   * Other values (and the `partial` flag) indicate some remote capability.
   */
  remote?: string | null;
  /** Part-time flag. */
  partial?: boolean | null;
  /** ISO-8601 creation timestamp. Example: `"2026-05-22T09:41:08.255Z"`. */
  created_at?: string | null;
  /** ISO-8601 last-update timestamp. */
  updated_at?: string | null;
  /** ISO-8601 contract start date. */
  start_date?: string | null;
  /** Explicit apply URL when present (often null — fall back to the job page). */
  apply_url?: string | null;
  /** Structured vacancy location. */
  address?: FlatchrAddress | null;
  /** Owning company object (carries the human-readable name). */
  company?: FlatchrCompany | null;
}

/**
 * One row in the `items` array of the listing response. The publication
 * wrapper carries distribution metadata; the embedded `vacancy` holds the
 * full job record.
 */
export interface FlatchrListItem {
  /** Opaque distribution-row id. */
  id?: string | null;
  /** Numeric offer / job-board id. */
  offer_id?: number | null;
  /** External id when syndicated from another source (often null). */
  external_id?: string | null;
  /** External URL when syndicated (often null). */
  external_url?: string | null;
  /** Whether this distribution row is published. */
  published?: boolean | null;
  /** Publication status label. Example: `"published"`. */
  status?: string | null;
  /** ISO-8601 row creation timestamp. */
  created_at?: string | null;
  /** Optional publish date. */
  publish_date?: string | null;
  /** The embedded full vacancy record. */
  vacancy?: FlatchrVacancy | null;
  /** Numeric vacancy id duplicated at the row level. */
  vacancy_id?: number | null;
}

/** Top-level response from `GET /company/{slug}.json`. */
export interface FlatchrListResponse {
  /** Array of published vacancy rows. */
  items?: FlatchrListItem[] | null;
  /** Error message present on a 404 / unknown-tenant response. */
  message?: string | null;
}
