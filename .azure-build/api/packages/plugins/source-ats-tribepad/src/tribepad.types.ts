/**
 * Internal data structures for the Tribepad HTML scraper.
 *
 * Because Tribepad serves server-rendered HTML rather than a public JSON API,
 * these interfaces represent data that has been extracted by parsing the
 * sitebuilder search-results page and the individual job detail pages.
 * Field names are chosen to be self-documenting rather than to mirror any
 * wire schema.
 */

/**
 * A single job listing as parsed from the Tribepad sitebuilder search-results
 * page (`.sitebuilder-job-results-item` cards).
 *
 * All fields are optional / nullable because the sitebuilder template is
 * highly configurable by tenant — some tenants hide salary or category chips.
 */
export interface TribepadListingItem {
  /**
   * Numeric record identifier extracted from the `record=` query parameter in
   * the job detail anchor's `href`. Used as the ATS id.
   */
  recordId?: string | null;

  /** Job title text from `.sitebuilder-job-results-item-title`. */
  title?: string | null;

  /** Absolute job detail page URL (`/members/modules/job/detail.php?record=`). */
  detailUrl?: string | null;

  /**
   * Location text extracted from the `fa-map-marker-alt` icon sibling within
   * `.sitebuilder-job-results-item-meta`. Example: "Stevenage" or "Wakefield".
   */
  location?: string | null;

  /**
   * Salary text extracted from the `fa-wallet` icon sibling. Example:
   * "£28500 - £32500" or "Grade 12 - £50,269 to £53,460".
   */
  salary?: string | null;

  /**
   * Category / work-type text from the `fa-tag` icon sibling. Example:
   * "Full Time" or "Education/Training/Instruction".
   */
  category?: string | null;

  /**
   * Contract type from the `fa-clock` icon sibling. Example: "Permanent" or
   * "Fixed Term".
   */
  contractType?: string | null;

  /**
   * Application closing date text from the `fa-calendar-times` icon sibling.
   * Format is typically `DD/MM/YY` or `DD/MM/YYYY` (tenant-configurable).
   * Example: "10/06/26" or "05/06/2026".
   */
  closingDate?: string | null;
}

/**
 * Additional fields harvested from the individual job detail page
 * (`/members/modules/job/detail.php?record={id}`). This is an optional
 * enrichment step — if fetching the detail page fails we still have the
 * listing-page data.
 */
export interface TribepadJobDetail {
  /** Numeric record id (mirrors TribepadListingItem.recordId). */
  recordId?: string | null;

  /**
   * Full HTML job description extracted from `section.job-details-section`
   * inside `#job-advert-wrapper` on the detail page.
   */
  descriptionHtml?: string | null;

  /**
   * More precise closing date from the `fa-calendar-check` sibling on the
   * detail page. Format: `DD/MM/YYYY`. Example: "05/06/2026".
   */
  closingDate?: string | null;

  /**
   * Tribepad job reference string (e.g. `getsetuk/TP/106/461`) from the
   * "Reference" label on the detail sidebar. Useful for dedup diagnostics
   * but not directly mapped to output fields.
   */
  reference?: string | null;

  /**
   * Resolved apply URL (absolute). On Tribepad detail pages this is always
   * `/members/?j={id}` — a relative URL that the service makes absolute
   * against the tenant host.
   */
  applyUrl?: string | null;
}

/**
 * Merged record combining listing and (optional) detail data, ready for
 * mapping to `JobPostDto`.
 */
export interface TribepadJob extends TribepadListingItem, TribepadJobDetail {}
