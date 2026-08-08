/**
 * Constants for the Applied (beapplied.com) ATS platform.
 *
 * Applied is a values-based, bias-reducing ATS that hosts its public-facing
 * career pages at:
 *
 *   https://app.beapplied.com/org/{orgId}/{orgSlug}
 *
 * where `orgId` is a numeric organisation identifier and `orgSlug` is a
 * human-readable slug (e.g. `1549/citizens-uk`).
 *
 * ---
 *
 * ## Public surface — no anonymous JSON API exists
 *
 * Extensive live probing (2026-06-03) confirms that ALL paths under
 * `app.beapplied.com/api/v1/...` return HTTP 401 Unauthorized without a
 * valid session token.  Applied deliberately gates its REST API behind
 * authentication and offers no unauthenticated JSON feed for job listings.
 *
 * The only publicly accessible surface without credentials is the server-
 * rendered HTML organisation page:
 *
 *   GET https://app.beapplied.com/org/{orgId}/{orgSlug}
 *     → HTML page containing anchors in the form:
 *         <a href="/apply/{jobSlug}">…job title…</a>
 *
 * Each individual job detail page is then:
 *
 *   GET https://app.beapplied.com/apply/{jobSlug}
 *     → HTML page with job title, company, location, salary, closing date,
 *       employment type, and the full description as rendered prose.
 *
 * There is no JSON-LD schema.org JobPosting markup on either page type.
 *
 * ## Tenant resolution
 *
 * The caller supplies either:
 *   - `companySlug` — the composite `{orgId}/{orgSlug}` string (e.g.
 *     `"1549/citizens-uk"`), OR
 *   - `companyUrl`  — the full URL such as
 *     `"https://app.beapplied.com/org/1549/citizens-uk"`, from which the
 *     `{orgId}/{orgSlug}` path is extracted.
 *
 * Slug-only lookup (without the numeric `orgId`) is NOT supported because
 * Applied's routing requires the numeric id; slug-only pages return HTTP 404.
 *
 * ## Live verification (2026-06-03)
 *
 *   org page  GET https://app.beapplied.com/org/1549/citizens-uk
 *     → HTTP 200, HTML; contains `/apply/cuxl7vasjy` link for the
 *       "Digital Communications Manager" role at Citizens UK.
 *   job page  GET https://app.beapplied.com/apply/cuxl7vasjy
 *     → HTTP 200, HTML; contains role title, salary (£39,560 pa), location
 *       (Hybrid, London), closing date, and full description prose.
 *   api probe GET https://app.beapplied.com/api/v1/organisations/1549/jobs
 *     → HTTP 401 Unauthorized (no public API surface).
 *
 * Confidence: **verified** (live HTTP responses observed this run).
 */

/** Base URL for all Applied career pages. */
export const APPLIED_BASE_URL = 'https://app.beapplied.com';

/** Org page path template; `{orgPath}` = `{orgId}/{orgSlug}`. */
export const APPLIED_ORG_PATH_TEMPLATE = '/org/{orgPath}';

/** Individual job detail page path prefix. */
export const APPLIED_JOB_PATH_PREFIX = '/apply/';

/**
 * Maximum number of per-job detail pages to fetch concurrently.
 * Applied's CDN is tolerant of small bursts; we keep this conservative to
 * avoid triggering rate-limiting.
 */
export const APPLIED_MAX_CONCURRENCY = 4;

/** Delay (ms) between sequential batches of concurrent detail fetches. */
export const APPLIED_REQUEST_DELAY_MS = 300;

/**
 * Default internal results cap when `resultsWanted` is not provided by the
 * caller.  Mirrors sibling ATS adapters.
 */
export const APPLIED_DEFAULT_RESULTS = 100;

/**
 * Request headers sent with every HTTP call.
 * Applied serves ordinary server-rendered HTML; a browser-like UA is enough
 * to pass any basic bot checks.
 */
export const APPLIED_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
