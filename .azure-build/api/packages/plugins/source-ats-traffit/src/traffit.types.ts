/**
 * TypeScript interfaces for the Traffit public published-adverts feed.
 *
 * The feed (`GET /public/job_posts/published`) returns a JSON array of job-post
 * envelopes. Each envelope carries the public job url/id and an `advert` object
 * whose `values[]` array holds field entries keyed by a `field_id` string (e.g.
 * `description`, `geolocation`). Field names mirror the real wire shape, which is
 * `snake_case`. A handful of `camelCase` aliases are modelled defensively so
 * minor cross-tenant drift never breaks the parser.
 */

/**
 * Structured geolocation object carried by the `geolocation` field. Free-text
 * place names are localised to the advert's language (e.g. country "Polska").
 */
export interface TraffitGeolocation {
  /** Country display name (localised, e.g. "Polska"). */
  country?: string | null;
  /** ISO-3166 alpha-2 country code (e.g. "pl"). */
  iso?: string | null;
  /** City / locality (e.g. "Gdynia"). */
  locality?: string | null;
  /** Administrative region tiers (region1 ~ state/voivodeship). */
  region1?: string | null;
  region2?: string | null;
  region3?: string | null;
  /** Geo coordinates (string-encoded on the wire). */
  latitude?: string | number | null;
  longitude?: string | number | null;
}

/**
 * A single field entry inside `advert.values[]`. `field_id` selects the field
 * (e.g. `description`, `geolocation`); `value` is a string for text fields and a
 * structured object for `geolocation`.
 */
export interface TraffitAdvertValue {
  /** Field key (e.g. "description", "geolocation"). */
  field_id?: string | null;
  /** Defensive camelCase alias. */
  fieldId?: string | null;
  /** Field payload — HTML string, plain string, or structured object. */
  value?: string | TraffitGeolocation | Record<string, unknown> | null;
}

/** Recruitment workflow reference carried by `advert.recruitment`. */
export interface TraffitRecruitment {
  workflow_id?: number | string | null;
  id?: number | string | null;
  /** Human-readable recruitment reference number (e.g. "1/6/2026/AW/817"). */
  nr_ref?: string | null;
}

/** The advert block carried in each job-post envelope. */
export interface TraffitAdvert {
  /** Internal advert id (distinct from the public job-post id). */
  id?: number | string | null;
  /** Job display title. */
  name?: string | null;
  /** Defensive alias for the title. */
  title?: string | null;
  /** Advert language code (e.g. "pl", "en"). */
  language?: string | null;
  /** Recruitment workflow reference. */
  recruitment?: TraffitRecruitment | null;
  /** Field entries — description, geolocation, and any custom fields. */
  values?: TraffitAdvertValue[] | null;
}

/** A single published job-post envelope returned by the feed. */
export interface TraffitJobPost {
  /** Public, anonymous job-detail URL (the candidate-facing advert page). */
  url?: string | null;
  /** Stable public job-post id — used as the ATS id. */
  id?: number | string | null;
  /** Publication start timestamp ("YYYY-MM-DD HH:MM:SS", tenant-local). */
  valid_start?: string | null;
  /** Defensive camelCase alias. */
  validStart?: string | null;
  /** True once the role has been filled/awarded. */
  awarded?: boolean | null;
  /** Optional Huntoo referral link. */
  huntoo_link?: string | null;
  /** Public application-form URL. */
  application_form?: string | null;
  /** Defensive camelCase alias. */
  applicationForm?: string | null;
  /** The advert content block. */
  advert?: TraffitAdvert | null;
}

/** Top-level feed shape: a JSON array of published job-post envelopes. */
export type TraffitPublishedResponse = TraffitJobPost[];
