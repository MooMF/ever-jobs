/**
 * Spec 006 / T03 — Avature internal types.
 *
 * Avature returns plain HTML, not JSON, so there is no upstream
 * schema to mirror. These types describe the parsed shape we build
 * inside the service before mapping to `JobPostDto`. Keeping them in
 * a separate file lets the unit tests (T04) import the same shape
 * without re-declaring it.
 */

/** Parsed shape of a single Avature job listing extracted from a search-results page. */
export interface AvatureParsedJob {
  /** ID extracted from the trailing path segment of the JobDetail link. */
  jobId: string;
  /** Job title (from `h2`/`h3`, a `.job-title`/`.position-title`/`.title` class, or the anchor text fallback). */
  title: string;
  /** Location string as displayed (no normalisation). */
  location: string | null;
  /** Department / category string, when present. */
  department: string | null;
  /** Fully-qualified URL pointing back at the job-detail page. */
  jobUrl: string;
}

/** Resolved tenant metadata used by `AvatureService` to build search URLs. */
export interface AvatureTenantContext {
  /**
   * Base URL to fetch search pages from, including any locale prefix
   * (e.g., `https://bloomberg.avature.net` or
   * `https://careers.ibm.com/en_US`).
   */
  baseUrl: string;
  /** Bare hostname without scheme — used in logs and JobPostDto.companyName fallback. */
  domain: string;
  /** Display-cased company name extracted from the hostname. */
  companyName: string;
}
