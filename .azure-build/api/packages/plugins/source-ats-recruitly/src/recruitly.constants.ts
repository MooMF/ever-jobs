/**
 * Constants for the Recruitly careers platform.
 *
 * Recruitly (recruitly.io — a UK-headquartered recruitment-agency CRM / ATS) exposes each
 * tenant's published, candidate-facing job board through a single, public, unauthenticated
 * JSON endpoint on its shared API host, addressed by the tenant's public board **API key**
 * (the per-tenant board credential Recruitly issues for embedding the board on the tenant's
 * own site — NOT the private back-office token):
 *
 *   https://api.recruitly.io/api/job?apiKey={apiKey}     (the tenant's published-roles feed)
 *
 * The endpoint answers a JSON envelope `{ "data": [ … ] }` whose `data` array holds every
 * published role. Each role carries a `hire…`-prefixed string `id` (the stable ATS id and
 * the final segment of the public apply URL), a numeric `uniqueId`, an agency `reference`
 * (e.g. `JB-3842`), a `title`, a `status` (`OPEN` / `CLOSED`), a `jobType` /
 * `employmentType`, a `remoteWorking` boolean, a `companyName` (the hiring brand the agency
 * is recruiting for), a structured `location` ({ addressLine, cityName, regionName,
 * postCode, countryCode, countryName, latitude, longitude }), a `pay` object (currency /
 * tenure / min-max / a pre-formatted `jobPayLabel`), a `postedOn` date (`DD/MM/YYYY`), an
 * HTML `description`, and a public `applyUrl`
 * (`https://jobs.recruitly.io/widget/apply/{id}`).
 *
 * The adapter reads the JSON feed directly — rather than depending on a client-rendered
 * DOM, a headless browser, or the authenticated back-office REST API. The caller addresses
 * a tenant board by its public board API key, passed as `companySlug` (the bare key) or
 * embedded in a `companyUrl` (a Recruitly board / widget / API URL carrying an `apiKey`
 * query parameter or an `/api/job` path). An unknown / revoked key, a tenant with no
 * published roles, or an empty board degrades naturally to an empty result. A fetch error,
 * an HTTP 4xx, a DNS failure, or a malformed body degrades to an empty / partial result
 * rather than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the public board API host + addressing: `GET https://api.recruitly.io/api/job
 *    ?apiKey={apiKey}` answered HTTP 200 with a `{ data: [ … ] }` envelope of published
 *    roles for a live demo board key (`WEAV…A21`), each role carrying a `hire…`-prefixed
 *    `id`, a `reference` (`JB-3842`), a structured `location`, a `pay` object, a `postedOn`
 *    (`DD/MM/YYYY`) date, an HTML `description`, and a public `applyUrl`
 *    (`https://jobs.recruitly.io/widget/apply/{id}`).
 *  - Confirmed the public board-embed surface documented by Recruitly: the iframe board
 *    `https://secure.recruitly.io/public/jobs/t?theme={n}&apiKey={apiKey}` and the apply
 *    widget `https://jobs.recruitly.io/widget/apply/{id}` are both anonymous. verified=true.
 */

/** API host serving the public, anonymous published-roles JSON feed. */
export const RECRUITLY_API_HOST = 'api.recruitly.io';

/** Public candidate-facing apply / widget host (`jobs.recruitly.io`). */
export const RECRUITLY_BOARD_HOST = 'jobs.recruitly.io';

/** Root domain — used to recognise Recruitly board / widget / API URLs passed via input. */
export const RECRUITLY_ROOT_DOMAIN = 'recruitly.io';

/** Public published-roles JSON endpoint path. */
export const RECRUITLY_JOB_PATH = '/api/job';

/** Public apply-widget path prefix (used to build `applyUrl` fallbacks). */
export const RECRUITLY_APPLY_PATH = '/widget/apply';

/** Builds the tenant board's public published-roles feed URL from its board API key. */
export const recruitlyJobFeedUrl = (apiKey: string): string =>
  `https://${RECRUITLY_API_HOST}${RECRUITLY_JOB_PATH}?apiKey=${encodeURIComponent(apiKey)}`;

/** Builds the canonical public apply-widget URL for a role id. */
export const recruitlyApplyUrl = (atsId: string): string =>
  `https://${RECRUITLY_BOARD_HOST}${RECRUITLY_APPLY_PATH}/${encodeURIComponent(atsId)}`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's published roles.
 */
export const RECRUITLY_DEFAULT_RESULTS = 100;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Recruitly API
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy board responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const RECRUITLY_DEFAULT_TIMEOUT_SECONDS = 15;

/** The role `status` token Recruitly emits for a live, applyable role. */
export const RECRUITLY_OPEN_STATUS = 'OPEN';

/** Default request headers. The JSON API expects a JSON Accept + a browser-like UA. */
export const RECRUITLY_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Detects remote / home-working roles across the title, location, and employment-type
 * fields, complementing the structured `remoteWorking` flag.
 */
export const RECRUITLY_REMOTE_REGEX =
  /\b(remote|remote[\s-]?working|home[\s-]?based|home[\s-]?working|home[\s-]?office|wfh|work\s*from\s*home|fully\s*remote|telework|teleworking)\b/i;
