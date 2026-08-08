/**
 * TypeScript interfaces for the Workwise public careers surface.
 *
 * A Workwise job is internally an "enquiry". The confirmed anonymous per-role surface is the
 * server-rendered detail page `https://www.workwise.io/job/{id}-{slug}`, which exposes a
 * full `enquiry` object (in the page's Next.js data island) and a `JobPosting` JSON-LD
 * block. The tenant's open-roles LIST is served client-side by the candidate jobs-search API
 * `POST https://api.workwise.io/v1/jobs/search` (session-gated), which returns a paginated
 * envelope `{ content | results | items, totalPages, … }` whose elements are the same
 * `enquiry` shape. The interfaces below model the subset of that wire shape the adapter
 * reads plus the normalised internal role assembled from it. Everything the adapter reads is
 * optional and defensively narrowed at parse time, so cross-tenant / future-shape drift
 * never breaks the parser.
 */

/** A role's employer block (`enquiry.company`). */
export interface WorkwiseCompany {
  /** Stable numeric company / customer id (e.g. `47188`). */
  id?: number | string | null;
  /** Employer display name (e.g. `aifinyo AG`). */
  name?: string | null;
  /** Employer slug (e.g. `aifinyo-ag`). */
  slug?: string | null;
  /** Employer website, when present. */
  website?: string | null;
  /** Head-office city, used as a location fallback. */
  city?: string | null;
  /** Head-office country code, used as a location fallback. */
  country?: string | null;
}

/** A single structured location entry (`enquiry.locationLevels[]`). */
export interface WorkwiseLocation {
  /** City / locality (e.g. `Dresden`). */
  city?: string | null;
  /** Region / state (e.g. `SN`). */
  region?: string | null;
  /** State display, when present. */
  state?: string | null;
  /** ISO 2-letter country code (e.g. `DE`). */
  country?: string | null;
  /** Postal code, when present. */
  zip?: string | null;
}

/** A structured description fragment (`enquiry.descriptionParts[]`). */
export interface WorkwiseDescriptionPart {
  /** Section heading, when present. */
  title?: string | null;
  /** Section body — may be HTML or plain text. */
  content?: string | null;
  /** Alternate body key some shapes use. */
  text?: string | null;
}

/**
 * A single role as returned by the candidate jobs-search API / detail page (`enquiry`).
 * Only the fields the adapter consumes are modelled; all are optional and defensively
 * narrowed.
 */
export interface WorkwiseEnquiry {
  /** Stable numeric role id — the ATS id (e.g. `121910`). */
  id?: number | string | null;
  /** Role display title (`name`). */
  name?: string | null;
  /** Alternate title key some shapes use. */
  title?: string | null;
  /** URL slug fragment (e.g. `backend-entwickler-ruby-on-rails-m-w-d`). */
  slug?: string | null;
  /** Lifecycle status (`open` when live). */
  status?: string | null;
  /** Rendered HTML / long-text description body. */
  description?: string | null;
  /** Short teaser description. */
  shortDescription?: string | null;
  /** Structured description fragments, when the body is split into parts. */
  descriptionParts?: WorkwiseDescriptionPart[] | null;
  /** ISO timestamp the role was first published. */
  firstPublished?: string | null;
  /** ISO timestamp the role was last (re-)published. */
  lastPublished?: string | null;
  /** ISO timestamp the role was last modified. */
  modified?: string | null;
  /** Employment / contract type token (e.g. `PERMANENT`, schema.org `FULL_TIME`). */
  type?: string | null;
  /** schema.org employment-type token, when present (e.g. `FULL_TIME`). */
  employmentType?: string | null;
  /** Remote-work flag / token, when present. */
  remoteWork?: boolean | string | null;
  /** schema.org job-location-type tokens (e.g. `["TELECOMMUTE"]`). */
  jobLocationTypes?: string[] | null;
  /** Structured locations. */
  locationLevels?: WorkwiseLocation[] | null;
  /** Job-role / category label, used as the department. */
  jobRole?: string | null;
  /** Employer block. */
  company?: WorkwiseCompany | null;
}

/**
 * The candidate jobs-search envelope. Modelled across the common pagination key names
 * (`content` / `results` / `items` / `data`) so a shape variation never breaks the parser;
 * the adapter narrows whichever array key is present to an array.
 */
export interface WorkwiseSearchResponse {
  /** Spring-style page of roles. */
  content?: WorkwiseEnquiry[] | null;
  /** Alternate roles array key. */
  results?: WorkwiseEnquiry[] | null;
  /** Alternate roles array key. */
  items?: WorkwiseEnquiry[] | null;
  /** Alternate roles array key. */
  data?: WorkwiseEnquiry[] | null;
  /** Total page count, when present. */
  totalPages?: number | null;
  /** Total element count, when present. */
  totalElements?: number | null;
  /** True when this is the final page, when present. */
  last?: boolean | null;
}

/**
 * Normalised view of a single Workwise role, ready to map to a JobPostDto.
 */
export interface WorkwiseJob {
  /** Stable ATS id (the role numeric `id`, stringified, e.g. `121910`). */
  atsId: string;

  /** Absolute public detail URL (`https://www.workwise.io/job/{id}-{slug}`). */
  url: string;

  /** Absolute public apply URL (the detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Employer display name (from the role's `company.name`, else de-slugified tenant). */
  companyName?: string | null;

  /** Structured location parts derived from the role's first location level. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's `jobRole`. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`). */
  employmentType?: string | null;

  /** Posted date — parsed from `firstPublished` / `lastPublished`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
