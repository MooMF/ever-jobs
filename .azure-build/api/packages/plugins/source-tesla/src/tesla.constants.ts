/**
 * Spec 013 / T07 — Tesla constants.
 *
 * Values mirror the upstream Python reference
 * (`OTHERS/Ats-scrapers/tesla/main.py`) so a future contributor can
 * `git diff` the two and convince themselves the wire format matches:
 * board endpoint, per-job detail endpoint, and the canonical
 * `https://www.tesla.com/careers/search/job/<slug>-<id>` URL pattern.
 *
 * **HTTP-only by design.** No `playwright` reference anywhere in this
 * file — Akamai bypass is a feature of the OPTIONAL companion plugin
 * `@ever-jobs/source-tesla-playwright` (Spec 013 / FR-13).
 */

/** Public Tesla origin used for both API + careers-portal URLs. */
export const TESLA_BASE_URL = 'https://www.tesla.com';

/** Board endpoint path — returns the entire current job catalogue in one GET. */
export const TESLA_BOARD_PATH = '/cua-api/apps/careers/state';

/**
 * Per-job detail endpoint template. Substituted with the listing's
 * `id` per Spec 013 / FR-11. We do NOT pre-bind this template at
 * load time so the test harness can re-import the constant cleanly
 * without monkey-patching string interpolation.
 */
export const TESLA_DETAIL_PATH_TEMPLATE = '/cua-api/careers/job/{id}';

/**
 * Public-facing careers URL pattern: the board endpoint exposes
 * `id` + `t` (title) only; the user-visible URL composes a
 * kebab-case slug from the title plus the trailing `-<id>` segment
 * (mirrors upstream Python's `create_job_url_slug()`).
 */
export const TESLA_PUBLIC_JOB_BASE = `${TESLA_BASE_URL}/careers/search/job`;

/** Ceiling on jobs returned when `input.resultsWanted` is unset. */
export const TESLA_DEFAULT_RESULTS_WANTED = 100;

/**
 * Per-job detail-fetch budget map (Spec 013 / Q-031 / FR-11).
 * `'detail-25'` is the default — caps follow-up GETs at 25 to honour
 * NFR-2 (`< 12 s` on the happy path). `'board'` skips detail entirely
 * (description stays null). `'detail-all'` exposes the full corpus
 * latency for operators who want every description.
 */
export const TESLA_DESCRIPTION_BUDGET: Record<string, number> = {
  board: 0,
  'detail-25': 25,
  'detail-all': Number.POSITIVE_INFINITY,
};

/** Default budget key — matches `ScraperInputDto.descriptionDepth` default. */
export const TESLA_DEFAULT_DESCRIPTION_DEPTH = 'detail-25';

/**
 * Browser-shaped headers. Same UA the upstream Python launches
 * Chromium with. `Accept: application/json` is the wire-protocol
 * negotiation hint — without it Tesla's Akamai-fronted gateway is
 * more likely to serve a `text/html` challenge page even on a
 * legitimate request.
 */
export const TESLA_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  Referer: `${TESLA_BASE_URL}/careers/search/`,
  Origin: TESLA_BASE_URL,
};

/**
 * HTTP status codes Akamai Bot Manager uses when challenging a
 * non-browser client. A response carrying any of these — OR an HTML
 * body when JSON was requested — triggers the
 * `ERR_TESLA_AKAMAI_CHALLENGE` sentinel and an empty
 * `JobResponseDto` per FR-12.
 */
export const TESLA_AKAMAI_STATUS_CODES: ReadonlySet<number> = new Set([
  403, 503,
]);

/**
 * Sentinel error codes (Spec 013 / § 7.3 / FR-12). Recorded via
 * `Logger.warn` when the matching failure mode is detected. NOT
 * thrown — `scrape()` always resolves with an empty `JobResponseDto`
 * per `AGENTS.md §10`.
 */
export const TESLA_ERR_AKAMAI_CHALLENGE = 'ERR_TESLA_AKAMAI_CHALLENGE';
export const TESLA_ERR_FETCH_FAILED = 'ERR_TESLA_FETCH_FAILED';
