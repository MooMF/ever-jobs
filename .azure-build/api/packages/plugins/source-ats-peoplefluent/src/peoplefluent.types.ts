/**
 * TypeScript interfaces for the PeopleFluent public RMS careers surface.
 *
 * PeopleFluent tenant career sites
 * (`careers.peopleclick.com/careerscp/client_{tenant}/external/...`) are thin
 * server-rendered shells whose results view renders each open role as an anchor pointing
 * at the canonical detail page `…/jobDetails/jobDetail.html?jobPostId={id}`. There is no
 * public JSON wire shape to model; the interfaces below describe the per-role fragment
 * the adapter parses out of a results-page anchor plus the normalised internal role
 * assembled from it. Everything the adapter reads is optional and defensively narrowed
 * at parse time, so cross-tenant or future-template drift never breaks the parser.
 */

/**
 * A single role as parsed out of the server-rendered results HTML. Sourced primarily
 * from a `jobDetail.html?jobPostId={id}` anchor (its href + inner text) plus any
 * adjacent location text the results row carries. Every field is optional and
 * defensively narrowed because tenants brand their boards differently.
 */
export interface PeopleFluentListing {
  /** Stable RMS `jobPostId` — the ATS id and the `jobPostId` query value of the detail URL. */
  jobPostId?: string | null;

  /** Absolute (or root-relative) canonical detail URL token from the anchor href. */
  detailUrl?: string | null;

  /** Role title hint — the anchor's inner text (HTML-stripped + entity-decoded). */
  title?: string | null;

  /** Free-text location string, when the results row carries one adjacent to the anchor. */
  location?: string | null;

  /** Locale code carried on the detail URL (`localeCode` query), when present. */
  localeCode?: string | null;
}

/**
 * Normalised view of a single PeopleFluent role, ready to map to a JobPostDto.
 */
export interface PeopleFluentJob {
  /** Stable ATS id (the RMS `jobPostId`). */
  atsId: string;

  /** Absolute public detail URL (the canonical career-site job-detail page). */
  url: string;

  /** Absolute public apply URL (the same detail/apply page in the RMS candidate flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the board carries no brand name). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used for remote detection. */
  locationText?: string | null;

  /** HTML / text job-ad body, when the listing carries one. */
  descriptionHtml?: string | null;

  /** Department / organisational-unit label, when present. */
  department?: string | null;

  /** Posted date — parsed to `YYYY-MM-DD` when an absolute date is available. */
  datePosted?: string | null;

  /** True when the role advertises remote / hybrid / home-working. */
  isRemote?: boolean | null;
}
