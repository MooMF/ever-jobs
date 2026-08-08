/**
 * TypeScript interfaces for the Concludis public career-portal surface.
 *
 * Two sources contribute to a full job record:
 *   - The server-rendered **listing page** HTML, parsed with cheerio into
 *     `ConcludisListingRow` objects (the reliable primary source).
 *   - The per-job **detail page** schema.org JSON-LD block, parsed into a
 *     `ConcludisJobPostingLd` (best-effort enrichment; may be absent).
 *
 * All fields are optional/nullable to tolerate sparse responses, missing
 * JSON-LD, and tenant-to-tenant variation.
 */

/**
 * One job row extracted from `div.stellen.list > div[id="line_{oid}"]` on the
 * Concludis listing page. This is the reliable primary record.
 */
export interface ConcludisListingRow {
  /**
   * Numeric per-tenant job id, taken from the `line_{oid}` element id (also the
   * `{oid}` path segment of the detail URL). Used as the ATS id.
   * Example: `"932"`
   */
  oid?: string | null;

  /** Human-readable job title (`span.headerlink.stellenlink`). */
  title?: string | null;

  /**
   * Canonical detail-page URL extracted from the row's
   * `onclick="cJobboard.openJob('…')"` handler.
   * Example:
   * `"https://hwk-stuttgart.concludis.de/prj/shw/{hash}_0/932/Slug.htm?b=0"`
   */
  detailUrl?: string | null;

  /** Short teaser/intro HTML (`span.kurzb`); used as a description fallback. */
  teaserHtml?: string | null;
}

/**
 * A schema.org `PostalAddress` as embedded in the detail-page JSON-LD.
 */
export interface ConcludisPostalAddress {
  '@type'?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  postalCode?: string | null;
  addressCountry?: string | null;
  streetAddress?: string | null;
}

/**
 * A schema.org `Place` (`jobLocation`) as embedded in the detail-page JSON-LD.
 */
export interface ConcludisPlace {
  '@type'?: string | null;
  address?: ConcludisPostalAddress | null;
}

/**
 * A schema.org `Organization` (`hiringOrganization`) from the detail JSON-LD.
 */
export interface ConcludisHiringOrganization {
  '@type'?: string | null;
  name?: string | null;
  sameAs?: string | null;
  logo?: string | null;
}

/**
 * The schema.org `JobPosting` JSON-LD object embedded in a Concludis detail page.
 * Present on some tenants/jobs only; treated as best-effort enrichment.
 */
export interface ConcludisJobPostingLd {
  '@context'?: string | null;
  '@type'?: string | null;
  /** ISO date string, e.g. `"2026-06-01"`. */
  datePosted?: string | null;
  title?: string | null;
  /** Full HTML job description. */
  description?: string | null;
  /** ISO datetime the posting is valid through, e.g. `"2026-06-30T23:59:59+02:00"`. */
  validThrough?: string | null;
  hiringOrganization?: ConcludisHiringOrganization | null;
  /** May be a single Place or an array of Places. */
  jobLocation?: ConcludisPlace | ConcludisPlace[] | null;
  /** schema.org employment type, e.g. `"FULL_TIME"`, `"PART_TIME"`. */
  employmentType?: string | string[] | null;
}

/**
 * Parsed listing-page result: the total reported count plus the rows on the
 * fetched page(s).
 */
export interface ConcludisListingResult {
  /** Total open roles reported by the "N Stellen gefunden" header. */
  total: number;
  /** Job rows parsed from this listing page. */
  rows: ConcludisListingRow[];
}
