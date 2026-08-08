/**
 * Constants for the Greeting careers platform.
 *
 * Greeting (greetinghr.com, by Dudaji — South Korea) is a Korean recruitment / HR ATS
 * (a "TRM" — talent relationship management) platform. Every customer tenant publishes a
 * branded, public, unauthenticated candidate-facing career site on the shared hosted
 * careers host, addressed by its company slug as a sub-domain:
 *
 *   https://{tenant}.career.greetinghr.com/                       (career-site shell)
 *   https://{tenant}.career.greetinghr.com/{locale}/home          (localised landing/board)
 *   https://{tenant}.career.greetinghr.com/{locale}/o/{openingId} (per-role detail page)
 *   https://{tenant}.career.greetinghr.com/{locale}/o/{openingId}/apply (apply page)
 *
 * The career site is a Next.js application. Its landing page is a thin server-rendered
 * shell that embeds the full set of open roles directly in the HTML inside the standard
 * Next.js `__NEXT_DATA__` script tag, as a React-Query "dehydrated state": a list of
 * pre-fetched queries. One of those queries (queryKey `["openings"]`) carries the full
 * open-roles array; another (queryKey `["publicCareer","getCareerBootInfo",{…}]`) carries
 * the tenant `workspaceId` and brand design. The adapter extracts the `__NEXT_DATA__`
 * JSON and reads those queries — rather than depending on a client-rendered DOM or a
 * headless browser.
 *
 * Each opening object carries (verified live shape):
 *   { openingId: 139155, title: "…", deploy: true, fixed: false,
 *     openDate: "2026-04-15T09:41:19Z", dueDate: null, deadlineDDay: null,
 *     group: { name: "…", imageUrl: "…" },
 *     openingJobPosition: { openingJobPositions: [ {
 *        workspaceOccupation: { occupation: "소프트웨어" },     // department / job family
 *        workspacePlace: { location: "…", place: "…", workFromHome: false },
 *        jobPositionEmployment: { employmentType: "FULL_TIME_WORKER" } } ] } }
 *
 * The richer HTML job-ad body is available via the public detail API:
 *
 *   GET https://api.greetinghr.com/ats/v3.5/career/workspaces/{workspaceId}/openings/{openingId}
 *     → { success, data: { openingsInfo: { openingId, status, title, detail: "<…HTML…>" },
 *                          jobPositionSetting: { jobPositions: [ … ] }, groupInfo, … } }
 *
 * The adapter reads the board's embedded openings for the listing, and (best-effort)
 * enriches each role's description from the detail API. The `openingId` is the stable
 * per-role ATS id and the final segment of the canonical detail / apply URL.
 *
 * An unknown tenant, a tenant with no open roles, or an empty board degrades naturally to
 * an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades
 * to an empty / partial result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.career.greetinghr.com`) and a
 *    real, named tenant on it: `ablelabs` (에이블랩스 / ABLE Labs,
 *    `https://ablelabs.career.greetinghr.com/`, which 301-redirects to `/ko/home`).
 *  - Confirmed the landing HTML embeds the full open-roles set in `__NEXT_DATA__` as the
 *    React-Query `["openings"]` dehydrated query, and the tenant `workspaceId` (1137) in
 *    the `getCareerBootInfo` query. A live role was observed: openingId `139155`
 *    ("자동화 장비 제어 SW 엔지니어 (Python)"), mapping to the canonical detail URL
 *    `/ko/o/139155` and apply URL `/ko/o/139155/apply` (verified=true).
 *  - Confirmed the public detail API `GET /ats/v3.5/career/workspaces/{workspaceId}/openings/{openingId}`
 *    on `https://api.greetinghr.com` returns HTTP 200 with `data.openingsInfo.detail` (HTML body).
 *    Other Greeting-powered tenants seen: `hanwha-finance`, `maplestoryworlds`.
 */

/** Hosted careers host suffix — tenant sites live at `{tenant}.career.greetinghr.com`. */
export const GREETING_CAREER_HOST_SUFFIX = '.career.greetinghr.com';

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const GREETING_ROOT_DOMAIN = 'greetinghr.com';

/** API host serving the public career detail endpoint. */
export const GREETING_API_ORIGIN = 'https://api.greetinghr.com';

/** Builds a tenant's career-site origin from its slug. */
export const greetingCareerOrigin = (tenant: string): string =>
  `https://${tenant}${GREETING_CAREER_HOST_SUFFIX}`;

/**
 * Builds the public detail API path for one role. The career front-end fetches the
 * rich job-ad body from the ATS aggregator under the `/ats` prefix:
 *   GET /ats/v3.5/career/workspaces/{workspaceId}/openings/{openingId}
 */
export const greetingOpeningDetailPath = (workspaceId: number | string, openingId: number | string): string =>
  `${GREETING_API_ORIGIN}/ats/v3.5/career/workspaces/${workspaceId}/openings/${openingId}`;

/**
 * Candidate landing paths, tried in order. The tenant root `/` 301-redirects to a
 * localised landing (e.g. `/ko/home`); we probe the localised landings directly (and the
 * bare root) and take the first one whose `__NEXT_DATA__` yields an openings query.
 */
export const GREETING_INDEX_PATHS: readonly string[] = ['', 'home'];

/**
 * Locale prefixes tried for the landing path. Greeting sites are localised; `ko` is the
 * Korean board (the platform's home locale) and `en` the English board. `''` (no prefix)
 * lets the tenant's default-locale redirect resolve. We try the default redirect first,
 * then Korean, then English.
 */
export const GREETING_LOCALES: readonly string[] = ['', 'ko', 'en'];

/** Career-site per-role detail path segment (used to build canonical job-ad URLs). */
export const GREETING_OPENING_PATH = 'o';

/** Career-site apply path segment, appended to the detail URL. */
export const GREETING_APPLY_PATH = 'apply';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const GREETING_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on landing pages fetched per scrape. The landing embeds the full tenant
 * board in a single document (no server-side pagination of the job set), so one page is
 * the norm; the ceiling guards any future variation across the locale/path probe matrix.
 */
export const GREETING_MAX_PAGES = 12;

/**
 * Hard ceiling on per-role detail-API enrichment fetches per scrape. Description
 * enrichment is best-effort; this bounds the fan-out so a large board never blows the CI
 * time budget. Roles beyond the cap still surface (without the enriched HTML body).
 */
export const GREETING_MAX_DETAIL_FETCHES = 30;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Greeting career
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const GREETING_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The career site expects a browser-like UA + HTML Accept. */
export const GREETING_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'ko,en-US;q=0.9,en;q=0.8',
};

/** Request header carrying the tenant `workspaceId` for the public detail API. */
export const GREETING_WORKSPACE_HEADER = 'X-Greeting-Workspace-Id';

/**
 * Captures the JSON embedded in the Next.js `__NEXT_DATA__` script tag on the landing
 * page. The capture group is the raw JSON document (the React-Query dehydrated state plus
 * page props). The adapter `JSON.parse`s the captured group.
 */
export const GREETING_NEXT_DATA_REGEX =
  /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i;

/** Detects remote / work-from-home roles across the title, location, and department fields. */
export const GREETING_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b|재택|원격/i;

/**
 * Maps Greeting `employmentType` enum tokens to a human-readable employment-type label.
 * Unknown / absent tokens yield null (the field is optional on the wire).
 */
export const GREETING_EMPLOYMENT_TYPES: Record<string, string> = {
  FULL_TIME_WORKER: 'Full-time',
  PART_TIME_WORKER: 'Part-time',
  CONTRACT_WORKER: 'Contract',
  INTERN: 'Internship',
  TEMPORARY_WORKER: 'Temporary',
  DISPATCHED_WORKER: 'Dispatched',
  FREELANCER: 'Freelance',
};
