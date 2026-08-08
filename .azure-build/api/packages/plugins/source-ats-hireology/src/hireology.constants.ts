/**
 * Constants for the Hireology applicant-tracking careers platform.
 *
 * Hireology hosts the public careers sites of its SMB / automotive / healthcare
 * customers from one shared host, `https://careers.hireology.com/{slug}`, where
 * `{slug}` is the tenant's careers path. The careers page is a thin React SPA
 * shell that bootstraps a `window.startingData` config containing the JSON API
 * base URL and a short-lived, anonymous, public bearer token (`apiToken`). The
 * SPA then loads the tenant's open roles from a single public REST endpoint:
 *
 *   GET https://api.hireology.com/v2/public/careers/{slug}
 *       header `Authorization: Bearer {apiToken}`
 *       optional query `page`, `page_size`
 *     → { data: HireologyJob[], count, page, page_size }
 *
 * The bearer token is NOT a private credential: it is minted unauthenticated
 * into every careers page load and only authorizes the read-only public feed.
 * We therefore first fetch the careers HTML shell, scrape the `apiToken` out of
 * its inline `startingData` JSON, then call the JSON API with that token. The
 * envelope reports the true `count`, so additional pages are fetched when the
 * caller wants more than one page's worth of roles.
 *
 * An unknown tenant slug yields HTTP 404 (and the careers shell yields no
 * token), both of which we treat as an empty (graceful) result rather than an
 * error. Verified live 2026-06-03 against the `hireology2` tenant.
 */

/** Shared public host that serves every Hireology-hosted careers SPA shell. */
export const HIREOLOGY_CAREERS_HOST = 'https://careers.hireology.com';

/** Shared public host for the Hireology JSON careers API. */
export const HIREOLOGY_API_HOST = 'https://api.hireology.com';

/** Public careers SPA shell path template (`{slug}` substituted) — source of the bootstrap token. */
export const HIREOLOGY_CAREERS_PAGE_TEMPLATE = '/{slug}';

/** Public, anonymous jobs feed path template (`{slug}` substituted). */
export const HIREOLOGY_JOBS_PATH_TEMPLATE = '/v2/public/careers/{slug}';

/** Public job-detail page path template (`{slug}`, `{id}` substituted). */
export const HIREOLOGY_JOB_PAGE_TEMPLATE = '/{slug}/{id}/description';

/**
 * Regex that lifts the anonymous public `apiToken` out of the careers page's
 * inline `window.startingData = { ... }` bootstrap blob.
 */
export const HIREOLOGY_TOKEN_REGEX = /"apiToken"\s*:\s*"([^"]+)"/;

/** Number of roles requested per page from the paginated feed. */
export const HIREOLOGY_PAGE_SIZE = 50;

/** Bounded fan-out width for the remaining-pages fetch (resilience over speed). */
export const HIREOLOGY_MAX_CONCURRENCY = 4;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public
 * DTO default is 15, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const HIREOLOGY_DEFAULT_RESULTS = 100;

/** Default request headers. Hireology expects a browser-like UA + JSON accept. */
export const HIREOLOGY_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
