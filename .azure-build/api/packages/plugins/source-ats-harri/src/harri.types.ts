/**
 * TypeScript interfaces for the Harri public careers-page HTML scraper.
 *
 * Harri (harri.com) has no public anonymous JSON API. Employer pages are
 * served as Angular SPA HTML. These interfaces model the data we parse from
 * the server-rendered HTML at two stages:
 *
 *   1. {@link HarriListJob}   — extracted from the employer careers listing page
 *      (`harri.com/{slug}`); contains the job link href components.
 *   2. {@link HarriDetailJob} — extracted from an individual job-detail page
 *      (`harri.com/{slug}/job/{jobId}-{titleSlug}`); contains the rich
 *      job data parsed from Open Graph meta tags and the HTML body.
 */

/**
 * Stub extracted from an anchor href on the employer's careers listing page.
 * The URL pattern `/{employerSlug}/job/{jobId}-{titleSlug}` yields all fields.
 */
export interface HarriListJob {
  /** Full absolute URL of the job-detail page, e.g. `https://harri.com/riverstation-careers/job/2734396-deputy-general-manager`. */
  jobUrl: string;
  /** Numeric job identifier extracted from the URL path, e.g. `'2734396'`. Used as `atsId`. */
  jobId: string;
  /** The employer slug path segment, e.g. `'riverstation-careers'`. */
  employerSlug: string;
  /** Hyphenated title slug from the URL, e.g. `'deputy-general-manager'`. */
  titleSlug: string;
}

/**
 * Rich job data parsed from the server-rendered HTML of a single job-detail page.
 * All fields are optional — the parser degrades gracefully when a field is absent.
 */
export interface HarriDetailJob {
  /** Job title extracted from `og:title` or `<h1>`. */
  title?: string | null;
  /** Employer / company name from `og:site_name` or the `<title>` element. */
  companyName?: string | null;
  /** Raw HTML description block extracted from the job-detail body. */
  description?: string | null;
  /** Free-text location string from `og:description` or address-like patterns. */
  locationRaw?: string | null;
  /** City parsed from the location string. */
  city?: string | null;
  /** State or region parsed from the location string. */
  state?: string | null;
  /** Country parsed from the location string. */
  country?: string | null;
  /** Whether the role is remote (inferred from title / description text). */
  isRemote?: boolean | null;
  /** Employment type string, e.g. `'Full Time'` / `'Part Time'`. */
  employmentType?: string | null;
  /** Raw pay string if present in the HTML, e.g. `'$17 - $20 / Hour'`. */
  payRaw?: string | null;
  /** Apply URL constructed as `{jobUrl}/apply/{jobId}`. */
  applyUrl?: string | null;
}
