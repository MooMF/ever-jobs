/**
 * Constants for the d.vinci applicant-tracking careers platform.
 *
 * d.vinci (dvinci-hr.com / dvinci.de) is a German ATS. Every customer tenant
 * publishes a branded, public careers portal on its own sub-domain
 * (`https://{slug}.dvinci-hr.com/`). Each portal exposes the vendor's documented
 * **Job Publication REST API**, which serves the tenant's full list of active
 * job publications from a single public, unauthenticated JSON endpoint:
 *
 *   GET https://{slug}.dvinci-hr.com/jobPublication/list.json?lang={lang}
 *     → [
 *         {
 *           id,                       // job-publication id (the public-page id)
 *           language,                 // publication locale ("de" / "en" / ...)
 *           position,                 // job title for display
 *           pageTitle, subtitle, pageDescription,
 *           jobPublicationURL,        // canonical public job-detail page URL
 *           applicationFormURL,       // public "apply" form URL
 *           startDate, endDate,       // publication window (often null)
 *           introduction, tasks, profile, weOffer, closingText,  // HTML sections
 *           jobOpening: {
 *             id, name, type,
 *             categories[], department, location,   // free-text location label
 *             locations[]: { name, country, address: { city, usState, ... } },
 *             workingTimes[], contractPeriod, targetGroups[],
 *             createdDate, ...
 *           }
 *         },
 *         ...
 *       ]
 *
 * The tenant is addressed by a `{slug}` — the first sub-domain label of the
 * portal host (e.g. `inverto` in `inverto.dvinci-hr.com`). Per the vendor docs
 * the job-publication API is "always public" (version 2022.11+): no auth, API
 * key, or cookie is required.
 *
 * The endpoint returns every active publication for the tenant in one array (no
 * server-side pagination), so we fetch once and slice client-side to honour
 * `resultsWanted`. An unknown tenant (the sub-domain does not resolve to a live
 * portal) or a portal with the interface disabled yields an HTTP 4xx
 * (typically 403/404), which we treat as an empty (graceful) result rather than
 * an error.
 *
 * Verified live 2026-06-03 against `inverto.dvinci-hr.com` (60 publications)
 * and `vhw.dvinci-hr.com` (2 publications): both returned HTTP 200 with a real
 * JSON array of job publications, no authentication.
 */

/** Public careers-portal host suffix shared by every d.vinci tenant. */
export const DVINCI_HOST_SUFFIX = 'dvinci-hr.com';

/**
 * Builds the public portal origin for a tenant slug, e.g.
 * `https://inverto.dvinci-hr.com`.
 */
export const DVINCI_HOST_TEMPLATE = 'https://{slug}.dvinci-hr.com';

/**
 * Public, unauthenticated job-publication list path. Returns the tenant's full
 * array of active job publications as JSON.
 */
export const DVINCI_LIST_PATH = '/jobPublication/list.json';

/** Default locale requested from the list endpoint (controls translated fields). */
export const DVINCI_DEFAULT_LANG = 'en';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's active publications.
 */
export const DVINCI_DEFAULT_RESULTS = 100;

/** Default request headers. The feed expects a browser-like UA + JSON accept. */
export const DVINCI_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
};
