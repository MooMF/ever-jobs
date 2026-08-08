/**
 * TypeScript interfaces for the Access PeopleHR public careers surface.
 *
 * A PeopleHR tenant board (`{tenant}.peoplehr.net/JobBoard`) is a single server-rendered HTML
 * page: each open role is emitted inline as a table row
 * (`<tr class="tabletrHght" data-url="/Pages/JobBoard/Opening.aspx?v={GUID}">`) carrying a
 * `lblVacancyName` (title), `lblLocation` (location), and `lblDepartment` (department) span, and
 * the page emits the tenant's display name once in a `lblCompanyName` element. There is no JSON
 * feed; the adapter parses these rows out of the HTML. The interfaces below describe the subset
 * of that surface the adapter reads (a per-row "wire" shape lifted from the HTML) plus the
 * normalised internal role assembled from it. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant or future-theme drift never breaks the
 * parser.
 */

/**
 * The raw per-row data lifted from a single board-listing table row, before normalisation. All
 * fields are optional / nullable because a future theme may omit a span or carry empty text.
 */
export interface PeopleHrBoardRow {
  /** Stable vacancy GUID — the ATS id, parsed from the row's `data-url` (`?v={GUID}`). */
  guid?: string | null;
  /** Role display title (the row's `lblVacancyName` text). */
  vacancyName?: string | null;
  /** Free-text location label (the row's `lblLocation` text, e.g. `FRA`, `London`). */
  location?: string | null;
  /** Free-text department / function label (the row's `lblDepartment` text). */
  department?: string | null;
}

/**
 * Normalised view of a single PeopleHR role, ready to map to a JobPostDto.
 */
export interface PeopleHrJob {
  /** Stable ATS id (the vacancy GUID). */
  atsId: string;

  /** Absolute public detail URL (the canonical `Opening.aspx?v={GUID}` page). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (the board's `lblCompanyName`, else derived from the slug). */
  companyName?: string | null;

  /** Free-text location label carried by the row. */
  locationText?: string | null;

  /** Department / function label, derived from the row's department span. */
  department?: string | null;

  /**
   * Role description body (HTML when present), else null. The per-role detail page renders its
   * body client-side, so the board surface exposes no description and this is normally null.
   */
  descriptionHtml?: string | null;

  /** True when the role advertises remote / home-working in its row fields. */
  isRemote?: boolean | null;
}
