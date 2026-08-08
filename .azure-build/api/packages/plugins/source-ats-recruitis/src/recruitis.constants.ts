/**
 * Constants for the Recruitis hosted career-site platform.
 *
 * Recruitis (recruitis.io) is a Czech Applicant Tracking System (ATS) widely
 * used by Central-European employers. Every customer tenant is served a public,
 * branded, server-rendered career site on the shared apex `jobs.recruitis.io`
 * under a per-tenant path segment:
 *
 *     https://jobs.recruitis.io/{tenant}
 *
 * (e.g. `https://jobs.recruitis.io/recruitisio`,
 *  `https://jobs.recruitis.io/allwyn`). The tenant token is a short, stable
 * slug assigned by Recruitis; it is the segment carried by `companySlug`.
 *
 * Two anonymous data surfaces exist on Recruitis:
 *
 *   1. The **authenticated REST API** at `https://app.recruitis.io/api2/jobs`
 *      (also `https://api.recruitis.io/`). It returns rich JSON but every call
 *      requires a per-company bearer token issued in the Recruitis admin
 *      (Settings -> API). An unauthenticated request is redirected to the admin
 *      login HTML page. We deliberately do NOT use this surface — it needs
 *      credentials we do not have for an arbitrary tenant.
 *
 *   2. The **public, anonymous career site** at `jobs.recruitis.io/{tenant}`.
 *      This is fully server-rendered HTML (no client-side JSON fetch needed)
 *      and is the surface this plugin scrapes with cheerio. It requires no
 *      authentication and is the same page Recruitis serves to job seekers.
 *
 * ---------------------------------------------------------------------------
 * VERIFIED LIVE WIRE SURFACE (byte-confirmed 2026-06-03)
 * ---------------------------------------------------------------------------
 *
 * Listing page — `GET https://jobs.recruitis.io/{tenant}?page={n}`
 *   HTTP 200, `text/html`. Each open role is one block:
 *
 *     <div class="row job ...">
 *       <div class="col-sm-9">
 *         <h3><a href="/{tenant}/{jobId}-{slug}">{Title}</a></h3>
 *         <p class="row-info ...">
 *           <span class="job-item ..."><i class="icon-location-pin"></i>&nbsp;{Location}</span>
 *           <span class="job-item ..."><i class="icon-tag"></i>&nbsp;{Category/Department}</span>
 *           <span class="job-item ..."><i class="icon-directions"></i>&nbsp;{EmploymentType}</span>
 *           <span class="job-item ..."><i class="icon-graduation"></i> {Education}</span>
 *         </p>
 *       </div>
 *       <div class="col-sm-3"><a href="/{tenant}/{jobId}-{slug}" class="btn ...">...</a></div>
 *     </div>
 *
 *   The job id is the leading numeric segment of the detail href
 *   (`/{tenant}/490653-...` -> atsId `490653`). The job-detail page URL is the
 *   same href resolved against `https://jobs.recruitis.io`.
 *
 *   Pagination: a summary element `<div class="pagination-summary">` reads
 *   "Zobrazeno 1 az N inzeratu z TOTAL" (Showing 1..N of TOTAL). The "next"
 *   control carries `aria-label="Dalsi"`; on the last page it gains the CSS
 *   class `u-pagination-v1-4--disabled`. We paginate `?page=n` until the next
 *   control is disabled, a page yields no new job blocks, or the run cap is
 *   reached. Unknown tenants return HTTP 404 (degrade to empty).
 *
 * Detail page — `GET https://jobs.recruitis.io/{tenant}/{jobId}-{slug}`
 *   HTTP 200, `text/html`. The full HTML description lives in:
 *
 *     <div class="col-lg-12" id="job-description"> ...HTML... </div>
 *
 *   The header location/category/employment chips are repeated here inside a
 *   `<div class="media-body ...">` block as `<span class="job-item ...">`.
 *
 * Verified live against two independent tenants on 2026-06-03:
 *   - `recruitisio` -> HTTP 200, 6 roles, full HTML descriptions returned.
 *   - `allwyn`      -> HTTP 200, 4 roles, same markup contract.
 *   - unknown tenant -> HTTP 404, zero job blocks (graceful empty).
 */

/** Shared apex serving every Recruitis public career site. */
export const RECRUITIS_CAREERS_APEX = 'jobs.recruitis.io';

/** Base URL (scheme + host) for every Recruitis-hosted tenant career site. */
export const RECRUITIS_CAREERS_BASE = 'https://jobs.recruitis.io';

/**
 * Host template for a tenant's public career site root.
 * `{tenant}` is substituted at runtime with the resolved tenant slug.
 */
export const RECRUITIS_TENANT_URL_TEMPLATE = 'https://jobs.recruitis.io/{tenant}';

/**
 * CSS selector for one job-listing block on the career-site listing page.
 * Each match corresponds to one open role.
 */
export const RECRUITIS_JOB_BLOCK_SELECTOR = 'div.row.job';

/** Selector for the title anchor inside a listing block. */
export const RECRUITIS_JOB_TITLE_SELECTOR = 'h3 a';

/** Selector for the meta chips (location / category / employment / education). */
export const RECRUITIS_JOB_CHIP_SELECTOR = 'span.job-item';

/** Selector for the pagination summary line ("Showing 1..N of TOTAL"). */
export const RECRUITIS_PAGINATION_SUMMARY_SELECTOR = '.pagination-summary';

/** Selector for the "next page" pagination control. */
export const RECRUITIS_PAGINATION_NEXT_SELECTOR = 'a[aria-label="Dalsi"], a[aria-label="Další"]';

/** CSS class marking a disabled pagination control (last page reached). */
export const RECRUITIS_PAGINATION_DISABLED_CLASS = 'u-pagination-v1-4--disabled';

/** Selector for the full HTML description container on a detail page. */
export const RECRUITIS_DESCRIPTION_SELECTOR = '#job-description';

/** Query-string key used to request a specific listing page (1-based). */
export const RECRUITIS_PAGE_PARAM = 'page';

/** Maximum number of listing pages we will walk in a single run (safety cap). */
export const RECRUITIS_MAX_PAGES = 20;

/** Maximum number of detail-page fetches issued concurrently per round. */
export const RECRUITIS_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential pagination rounds, to stay polite. */
export const RECRUITIS_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. When `resultsWanted` is omitted we ingest up to
 * this many of the tenant's open roles.
 */
export const RECRUITIS_DEFAULT_RESULTS = 100;

/**
 * Default request headers. The career site is plain server-rendered HTML, so a
 * browser-like Accept and User-Agent are sent for politeness / WAF tolerance.
 */
export const RECRUITIS_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,cs;q=0.8',
};
