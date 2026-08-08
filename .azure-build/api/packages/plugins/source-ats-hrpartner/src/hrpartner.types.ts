/**
 * TypeScript interfaces for the HR Partner public careers surface.
 *
 * HR Partner tenant boards (`{tenant}.hrpartner.io/jobs`) are server-rendered HTML pages
 * (no SPA, no `__NEXT_DATA__` data island, no public JSON API) that emit every open role
 * directly in the markup as a `.job-listing` card. The adapter parses each card from the
 * HTML. The interfaces below describe the per-card fields the adapter reads (after regex
 * extraction) plus the normalised internal role assembled from them. Everything the
 * adapter reads is optional and defensively narrowed at parse time, so cross-tenant or
 * future-shape drift never breaks the parser.
 */

/**
 * A single role as scraped from a server-rendered `.job-listing` card on the board. Only
 * the fields the adapter consumes are modelled; all are optional and defensively narrowed.
 */
export interface HrPartnerJobItem {
  /** Slug — the final segment of `/jobs/{slug}`; the stable ATS id. */
  slug?: string | null;
  /** Absolute or relative `/jobs/{slug}` href captured from the card title link. */
  href?: string | null;
  /** Role display title (the card `<h3>` text). */
  title?: string | null;
  /** Free-text role summary body (the card `job-content` block, as HTML). */
  summaryHtml?: string | null;
  /** Role location (the first `rounded-full` pill tag), when present. */
  location?: string | null;
  /** Category / department (the remaining `rounded-full` pill tags), when present. */
  category?: string | null;
}

/**
 * Normalised view of a single HR Partner role, ready to map to a JobPostDto.
 */
export interface HrPartnerJob {
  /** Stable ATS id (the role slug). */
  atsId: string;

  /** Absolute public detail URL (the canonical board `/jobs/{slug}` page). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (the board brand, else the de-slugified slug). */
  companyName?: string | null;

  /** Free-text location line (the first pill tag), used for remote detection. */
  locationText?: string | null;

  /** Role summary body (when the card exposes one), else null. */
  descriptionHtml?: string | null;

  /** Category / department label. */
  department?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
