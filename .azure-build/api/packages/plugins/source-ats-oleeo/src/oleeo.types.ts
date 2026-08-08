/**
 * TypeScript interfaces for the Oleeo (TAL.net) public candidate careers surface.
 *
 * Oleeo's candidate-facing job board (`/candidate/jobboard/vacancy/1/adv/` on a
 * `{tenant}.tal.net` host) is server-rendered HTML, and each opportunity's detail
 * page (`…/opp/{ID}-{slug}/en-GB`) is likewise server-rendered HTML with no
 * schema.org JSON-LD. There is therefore no JSON wire shape to model; the
 * interfaces below describe the fragments the adapter parses out of the board
 * (each opportunity anchor) and detail pages, plus the normalised internal role
 * assembled from them. Everything the adapter reads is optional and defensively
 * narrowed at parse time, so cross-tenant or future-layout drift never breaks the
 * parser.
 */

/**
 * A single opportunity as parsed out of the board HTML. Assembled from a canonical
 * opportunity anchor (`…/opp/{ID}-{title-slug}/en-GB`) plus, when fetched, the
 * labelled / free-text fields recovered from its detail page.
 */
export interface OleeoBoardJob {
  /** Numeric Oleeo vacancy id — the `{ID}` URL segment (e.g. `26870`). The ATS id. */
  id: string;
  /** Title slug — the `{title-slug}` URL segment (e.g. `Post-Security-Manager-SRB26-006248`). */
  slug?: string | null;
  /** Absolute canonical detail / apply URL parsed from (or built around) the anchor. */
  url?: string | null;
  /** Human-readable job title (from the detail page, falling back to the slug). */
  title?: string | null;
  /** Raw location text (recovered from the detail page), when present. */
  location?: string | null;
  /** Raw employment-type text (recovered from the detail page), when present. */
  employmentType?: string | null;
  /** Raw closing/posted date text (recovered from the detail page), when present. */
  dateText?: string | null;
  /** Detail-page body HTML, used for the description + remote/email signals, when fetched. */
  bodyHtml?: string | null;
}

/**
 * Normalised view of a single Oleeo role, ready to map to a JobPostDto.
 */
export interface OleeoJob {
  /** Numeric Oleeo vacancy id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the canonical `/opp/{ID}-{slug}` page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the board carries no single brand token). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used for the remote signal. */
  locationText?: string | null;

  /** Employment-type label (from the detail page), when present. */
  employmentType?: string | null;

  /** Posted / closing date — parsed when an absolute date is available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;

  /** Description text (format-converted from the detail body), when present. */
  description?: string | null;
}
