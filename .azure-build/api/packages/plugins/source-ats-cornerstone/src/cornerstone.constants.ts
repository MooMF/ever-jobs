/**
 * Constants for the Cornerstone OnDemand (CSOD) Recruiting careers platform.
 *
 * Cornerstone powers the careers sites of many enterprises and public-sector
 * employers. Each tenant lives at `https://{client}.csod.com`, and its public
 * candidate-facing career site is served from
 *   `https://{client}.csod.com/ux/ats/careersite/{careerSiteId}/home?c={client}`
 *
 * The career-site listing data is fetched by the front-end from a regional
 * "cloud" API host (e.g. `https://us.api.csod.com`, `https://eu.api.csod.com`)
 * via a POST to `/rec-job-search/external/jobs`. That endpoint is callable
 * WITHOUT operator credentials: the public career-site HTML embeds an anonymous
 * JWT (`"token":"eyJ..."`) whose `rurls` claim explicitly whitelists
 * `rec-job-search/external`, plus an `"endpoints":{"cloud":"https://…"}` host.
 *
 * So the realistic public flow is a two-step bootstrap:
 *   1. GET the public career-site page → scrape the anonymous token + cloud host.
 *   2. POST `{cloud}/rec-job-search/external/jobs` with that bearer token to
 *      page the requisitions.
 *
 * Both steps require no human/OAuth credentials; the token is the same one the
 * browser uses for anonymous browsing. Tokens are short-lived (~1h) but we mint
 * a fresh one per run from the bootstrap page, so expiry is a non-issue here.
 */

/** Host template for Cornerstone-hosted tenants; `{slug}` is substituted at runtime. */
export const CORNERSTONE_HOST_TEMPLATE = 'https://{slug}.csod.com';

/** Public career-site bootstrap page path; `{siteId}` / `{slug}` substituted at runtime. */
export const CORNERSTONE_HOME_PATH = '/ux/ats/careersite/{siteId}/home?c={slug}';

/** Public requisition search endpoint path, relative to the regional cloud host. */
export const CORNERSTONE_SEARCH_PATH = '/rec-job-search/external/jobs';

/** Canonical public job-detail URL template (tenant host + this path). */
export const CORNERSTONE_REQUISITION_PATH =
  '/ux/ats/careersite/{siteId}/home/requisition/{reqId}?c={slug}';

/**
 * Default career site id. Most single-portal tenants use `1`; multi-portal
 * tenants expose others (2, 4, 5, 6, …). Overridable via `siteNumber`.
 */
export const CORNERSTONE_DEFAULT_SITE_ID = '1';

/** Default culture (en-US) id / name used by the search payload. */
export const CORNERSTONE_DEFAULT_CULTURE_ID = 1;
export const CORNERSTONE_DEFAULT_CULTURE_NAME = 'en-US';

/** Requisitions requested per search page. */
export const CORNERSTONE_PAGE_SIZE = 25;

/** Maximum number of search pages to fetch concurrently per tenant. */
export const CORNERSTONE_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential pagination rounds, to stay polite. */
export const CORNERSTONE_REQUEST_DELAY_MS = 300;

/**
 * Regular expression that lifts the anonymous bearer token out of the public
 * career-site HTML. The page emits `"token":"eyJ..."` (a JWT) alongside the
 * regional endpoint config.
 */
export const CORNERSTONE_TOKEN_REGEX = /"token"\s*:\s*"([A-Za-z0-9_.-]{20,})"/;

/**
 * Regular expression that lifts the regional cloud API host out of the page,
 * e.g. `"endpoints":{"cloud":"https://us.api.csod.com"}`.
 */
export const CORNERSTONE_CLOUD_HOST_REGEX = /"cloud"\s*:\s*"(https:\/\/[a-z0-9.-]+\.csod\.com)"/i;

/** Fallback regional cloud host when the page does not expose one explicitly. */
export const CORNERSTONE_FALLBACK_CLOUD_HOST = 'https://us.api.csod.com';

/** Default request headers. CSOD expects a browser-like UA + JSON accept. */
export const CORNERSTONE_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
