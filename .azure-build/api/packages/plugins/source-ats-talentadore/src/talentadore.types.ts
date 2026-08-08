/**
 * TypeScript interfaces for the TalentAdore public positions JSON feed.
 *
 * The feed (`GET /positions/{feedKey}/json`) returns a single envelope object
 * whose `jobs` array holds the tenant's open roles. Field names mirror the real
 * wire shape, which is `snake_case`. A handful of `camelCase` aliases are
 * modelled defensively so minor cross-tenant or future-version drift never
 * breaks the parser.
 */

/** A single open position as returned in the feed's `jobs[]` array. */
export interface TalentAdoreJob {
  /** Stable short job id — used as the ATS id. */
  id?: string | number | null;

  /** Opaque apply/job token — the trailing segment of the public apply URL. */
  job_token?: string | null;
  jobToken?: string | null;

  /** Job display title. */
  name?: string | null;
  title?: string | null;

  /** Absolute public apply / job-detail URL (e.g. `…/apply/{slug}/{job_token}`). */
  link?: string | null;
  url?: string | null;

  /** Full job-ad body — HTML and/or pre-stripped plain text. */
  description_html?: string | null;
  description_text?: string | null;
  descriptionHtml?: string | null;
  descriptionText?: string | null;

  /** ISO-8601 timestamps. `start_date` is the publish date; `updated` the last edit. */
  start_date?: string | null;
  startDate?: string | null;
  updated?: string | null;
  /** ISO-8601 application deadline; often an empty string when open-ended. */
  due_date?: string | null;
  dueDate?: string | null;

  /** Free-text full location string (e.g. "Zabłocie 43B, 30-701 Kraków"). */
  location?: string | null;
  /** Structured location parts. `city`/`country` are usually present; `county` ≈ region/state. */
  city?: string | null;
  county?: string | null;
  country?: string | null;

  /** Free-text tag and category labels attached to the role. */
  tags?: string[] | null;
  categories?: string[] | null;

  /** Employment-type label (free text, e.g. "Civil contract", "Full-time"). */
  employment_type?: string | null;
  employmentType?: string | null;

  /** Owning business unit / department metadata. */
  business_unit_id?: string | null;
  business_unit_name?: string | null;
  businessUnitName?: string | null;
  /** Business-unit description (HTML) — modelled for completeness; not mapped. */
  business_unit_description?: string | null;

  /** Hero / header image and tenant logo URLs (not mapped to JobPostDto). */
  image?: string | null;
  logo?: string | null;
}

/** Top-level envelope returned by `GET /positions/{feedKey}/json`. */
export interface TalentAdoreFeedResponse {
  /** Feed schema version (e.g. "1.0"). */
  version?: string | null;
  /** Tenant display name (e.g. "Amer Sports"). */
  company?: string | null;
  /** ISO-8601 feed-generation timestamp. */
  generated_at?: string | null;
  generatedAt?: string | null;
  /** Open roles for the tenant. */
  jobs?: TalentAdoreJob[] | null;
}
