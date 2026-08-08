/**
 * TypeScript interfaces for the Recruitis public career-site wire shapes.
 *
 * Recruitis serves each tenant a server-rendered HTML career site at
 * `https://jobs.recruitis.io/{tenant}`. There is no anonymous JSON surface;
 * these interfaces model the structured records this plugin extracts from the
 * HTML with cheerio. All fields are optional/nullable because the markup omits
 * chips (location, category, employment type, education) on sparse roles.
 */

/**
 * A single role parsed from one `div.row.job` block on the listing page.
 * Field names are our normalised names (the source is HTML, not JSON).
 */
export interface RecruitisJobListItem {
  /**
   * Numeric job id — the leading segment of the detail href
   * (`/{tenant}/490653-...` -> `"490653"`). Used as the ATS id.
   */
  atsId?: string | null;

  /** Human-readable job title (text of the `h3 a` anchor). */
  title?: string | null;

  /**
   * Absolute URL of the job-detail page on the tenant career site.
   * Example: `"https://jobs.recruitis.io/recruitisio/490653-..."`.
   */
  jobUrl?: string | null;

  /** Free-text location chip (e.g. `"Hradec Kralove, CZ"`). */
  location?: string | null;

  /**
   * Category / department chip (e.g. `"Administrativa"`). Mapped to the
   * `department` output field.
   */
  category?: string | null;

  /** Employment-type chip (e.g. `"Prace na plny uvazek"` — full-time). */
  employmentType?: string | null;

  /** Education-requirement chip (e.g. `"Vzdelani neni podstatne"`). */
  education?: string | null;
}

/**
 * Detail-page extraction result: the full HTML description plus any chips
 * repeated in the detail header (used as a fallback when the listing chip was
 * absent).
 */
export interface RecruitisJobDetail {
  /** Full HTML job description (inner HTML of `#job-description`). */
  description?: string | null;

  /** Location chip repeated on the detail header (fallback). */
  location?: string | null;

  /** Category chip repeated on the detail header (fallback). */
  category?: string | null;

  /** Employment-type chip repeated on the detail header (fallback). */
  employmentType?: string | null;
}

/** Parsed metadata + items extracted from one listing page. */
export interface RecruitisListingPage {
  /** Roles parsed from this page. */
  items: RecruitisJobListItem[];
  /**
   * Total open-role count reported by the pagination summary, when present.
   * Null when the summary could not be parsed.
   */
  total: number | null;
  /** True when a non-disabled "next page" control is present on this page. */
  hasNext: boolean;
}
