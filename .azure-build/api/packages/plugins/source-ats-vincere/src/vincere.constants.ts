/**
 * Constants for the Vincere Instant Job Board (IJB) platform.
 *
 * Vincere is a recruitment agency ATS/CRM used by staffing firms worldwide.
 * Every tenant's public job board is served from its own sub-domain under the
 * shared apex `vincere.io` at the `/careers` path:
 *
 *   https://{slug}.vincere.io/careers/
 *
 * Some tenants front that with a custom domain, in which case the adapter
 * derives the slug from the first sub-domain label of `companyUrl`.
 *
 * ─── Wire Surface ─────────────────────────────────────────────────────────────
 *
 * The Instant Job Board is a PHP/Laravel application that server-renders the
 * first page of results and re-renders subsequent pages via an AJAX endpoint.
 * There are two distinct URL surfaces:
 *
 *   1. **Listing page** (server-rendered HTML):
 *        GET https://{slug}.vincere.io/careers/
 *          → Full HTML page, jobs as `<article class="job">` elements.
 *          → The page embeds the total job count in
 *            `<span class="js-num-of-jobs">{total}</span>` and in the JS init
 *            call `EH.index.generatePagination({total})`.
 *          → Also contains the CSRF token needed by the AJAX search endpoint:
 *            `<meta name="csrf-token" content="{token}">`.
 *          → The response sets two cookies: `XSRF-TOKEN` and `laravel_session`.
 *
 *   2. **AJAX search endpoint** (public, no auth — CSRF-only):
 *        POST https://{slug}.vincere.io/careers/ajax/search-jobs
 *          Headers: X-CSRF-TOKEN: {token}, X-Requested-With: XMLHttpRequest
 *          Cookies: laravel_session={session}
 *          Body: multipart/form-data — page={n} (other fields optional)
 *          → { items: VincereJob[], total: number, more: boolean,
 *               facets: {...}, html: "..." }
 *
 *      The `items` array contains fully structured job objects with HTML
 *      descriptions, location details, employment type, date, and IDs. No
 *      per-job detail fetch is necessary — all data is in the listing response.
 *      The `html` field is a pre-rendered HTML fragment (ignored by this adapter
 *      in favour of the structured `items`). Ten items are returned per page;
 *      `more` is true when additional pages exist.
 *
 *   3. **Job detail page**:
 *        GET https://{slug}.vincere.io/careers/job/{id}/{slug-and-location}
 *          → Individual job HTML page with JSON-LD JobPosting schema markup.
 *          → Not fetched by this adapter since all data is in the listing.
 *
 * ─── Vincere Private API (NOT used) ──────────────────────────────────────────
 *
 * Vincere also exposes a private REST API at
 * `https://{slug}.vincere.io/api/v2/job/search/` that requires
 * `x-api-key` and `id-token` headers obtained via OAuth2. This adapter
 * deliberately does NOT use that surface; it is restricted to account holders.
 *
 * ─── Verification ─────────────────────────────────────────────────────────────
 *
 * Live-confirmed 2026-06-03 against `nordicjobsworldwide.vincere.io`:
 *   - GET /careers/ → HTTP 200, HTML with 193 jobs, CSRF token present.
 *   - POST /careers/ajax/search-jobs (page=1) → HTTP 200, JSON
 *     `{ items: [...10 VincereJob], total: 193, more: true, facets: {...}, html: "..." }`
 *   - `items[0]` sample: id=62597, job_title="Swedish and Norwegian-Speaking
 *     Customer Support in Lisbon, Portugal", location.country="Portugal",
 *     published_date="2026-06-02T13:12:50.819Z", job_type="PERMANENT",
 *     employment_type="FULL_TIME", public_description="<p>...</p>".
 */

/** Shared apex for every Vincere Instant Job Board tenant sub-domain. */
export const VINCERE_APEX = 'vincere.io';

/** Host template for Vincere-hosted tenants; `{slug}` is substituted at runtime. */
export const VINCERE_HOST_TEMPLATE = 'https://{slug}.vincere.io';

/** Public careers listing page path (server-renders jobs + seeds CSRF token). */
export const VINCERE_CAREERS_PATH = '/careers/';

/** Public AJAX search endpoint path; requires CSRF token + session cookie from the listing page. */
export const VINCERE_SEARCH_PATH = '/careers/ajax/search-jobs';

/**
 * Job detail page URL path template.
 * `{id}` is the numeric job id; `{slug}` is the job's URL-slug segment.
 * In practice the slug may include a trailing city/location segment separated
 * by a `/`, but the canonical URL for deep-linking is `/careers/job/{id}`.
 */
export const VINCERE_JOB_PAGE_TEMPLATE = '/careers/job/{id}/{slug}';

/**
 * Number of job items the AJAX endpoint returns per page.
 * Observed consistently as 10 on all tested tenants; the JS pagination
 * widget is initialised with `itemsOnPage: 10`.
 */
export const VINCERE_PAGE_SIZE = 10;

/** Maximum number of pages to fetch concurrently after the first page. */
export const VINCERE_MAX_CONCURRENCY = 5;

/** Polite delay (ms) between pagination fan-out rounds. */
export const VINCERE_REQUEST_DELAY_MS = 300;

/**
 * Default internal results cap. Callers that omit `resultsWanted` receive up
 * to this many jobs. Mirrors the sibling ATS adapter convention (100 open roles).
 */
export const VINCERE_DEFAULT_RESULTS = 100;

/**
 * Default request headers that mirror a real browser visiting the careers page.
 * The `X-Requested-With` header is required for the AJAX endpoint to return
 * JSON rather than a redirect.
 */
export const VINCERE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/**
 * Additional headers for the AJAX POST request.
 * Merged on top of `VINCERE_HEADERS` when making the search call.
 */
export const VINCERE_AJAX_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/x-www-form-urlencoded',
};
