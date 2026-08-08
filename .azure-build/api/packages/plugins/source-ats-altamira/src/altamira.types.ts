/**
 * TypeScript interfaces for the Altamira Recruiting public careers surface.
 *
 * Altamira's candidate-facing career site (`{tenant}.altamiraweb.com`) is a
 * server-rendered HTML board, so there is no JSON wire shape to model. The
 * interfaces below describe the fragments the adapter parses out of the
 * server-rendered open-roles index (each job anchor + the title / location encoded
 * in its slug) and the normalised internal role assembled from them, optionally
 * enriched by the detail page body. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant or future-layout drift never
 * breaks the parser.
 */

/**
 * A single role as parsed out of the index HTML. Assembled from a canonical job
 * anchor — either the SEO form `/jobs/{Title-Country-Region-City-slug}-{JobID}.htm`
 * or the query form `/jobs/job-details?JobID={JobID}` — with the numeric `{JobID}`
 * as the ATS id and (for the SEO form) the title + `Country-Region-City` location
 * recovered from the slug.
 */
export interface AltamiraIndexJob {
  /** Numeric Altamira job id — the trailing `{JobID}` token (e.g. `561445691`). The ATS id. */
  id: string;
  /** The raw SEO slug between `/jobs/` and `-{JobID}.htm`, when the anchor is the SEO form. */
  slug?: string | null;
  /** Absolute canonical careers detail / apply URL parsed/built from the anchor. */
  url?: string | null;
  /** Human-readable job title (de-slugified from the SEO slug head). */
  title?: string | null;
  /** Raw location text recovered from the SEO slug tail (e.g. "Italia Veneto Padova"). */
  location?: string | null;
}

/**
 * Normalised view of a single Altamira role, ready to map to a JobPostDto.
 */
export interface AltamiraJob {
  /** Numeric Altamira job id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the canonical `.htm` careers page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the index carries no brand name). */
  companyName?: string | null;

  /** Structured location parts derived from the slug location tail. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw multi-token location string, used as the description fallback / remote signal. */
  locationText?: string | null;

  /** Job-ad body text recovered from the detail page (when enrichment succeeds). */
  descriptionHtml?: string | null;

  /** Posted date — parsed when an absolute date is recoverable; otherwise null. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
