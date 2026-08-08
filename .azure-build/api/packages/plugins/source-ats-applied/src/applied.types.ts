/**
 * TypeScript interfaces for the Applied (beapplied.com) HTML scraping layer.
 *
 * Applied does not expose a public anonymous JSON API; all data is extracted
 * from the server-rendered HTML pages.
 *
 * The scraper operates in two steps:
 *
 *   1. Parse the organisation page HTML to extract job links.
 *   2. Fetch each job detail page and parse the role metadata from HTML.
 *
 * These interfaces model the parsed results of those two steps.
 */

/**
 * A job link extracted from the organisation listing page.
 *
 * The org page renders an anchor for each open role:
 *   <a href="/apply/{jobSlug}">…title…</a>
 *
 * An optional brief location hint may appear near the link text.
 */
export interface AppliedJobLink {
  /** The URL-slug portion of the apply path, e.g. `"cuxl7vasjy"`. */
  jobSlug: string;

  /** Full apply URL, e.g. `"https://app.beapplied.com/apply/cuxl7vasjy"`. */
  jobUrl: string;

  /**
   * Job title as it appears in the link text on the org page.
   * May be null if the anchor text is empty; callers should skip null titles.
   */
  title: string | null;

  /** Brief location hint scraped from the org-page listing row, if present. */
  locationHint: string | null;
}

/**
 * Detailed job metadata parsed from an individual Applied job page at
 * `https://app.beapplied.com/apply/{jobSlug}`.
 *
 * Not all fields are present on every posting; all are optional / nullable.
 */
export interface AppliedJobDetail {
  /** Canonical job title from the page heading. */
  title: string | null;

  /** Employer name displayed on the job detail page. */
  companyName: string | null;

  /**
   * Location string from the job page, e.g. `"Hybrid · London, City of, UK"`.
   * The `"·"` separator is used to split work-type prefix from location label.
   */
  locationRaw: string | null;

  /**
   * Detailed location note providing more context, e.g.
   * `"Hybrid, London Office – Our office is based in London…"`.
   */
  locationDetail: string | null;

  /** Salary display string as it appears on the page, e.g. `"£39,560 pa"`. */
  salaryRaw: string | null;

  /** Employment type string, e.g. `"Full time 37.5 hours per week"`. */
  employmentType: string | null;

  /**
   * Application closing date string as rendered on the page,
   * e.g. `"11:59pm, 7th Jun 2026 BST"`.
   */
  closingDateRaw: string | null;

  /**
   * Full job description as an HTML string.  Applied's description is rendered
   * as formatted prose; this field preserves the HTML structure so callers can
   * apply their chosen `DescriptionFormat` conversion.
   */
  descriptionHtml: string | null;
}
