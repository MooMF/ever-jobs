/**
 * Constants for the Gupy careers platform.
 *
 * Gupy (gupy.io, Brazil — the largest recruitment / ATS in Brazil & LATAM) powers each
 * customer's branded, public, unauthenticated candidate-facing career site on the
 * shared host, addressed by its company slug as a sub-domain of the root domain:
 *
 *   https://{tenant}.gupy.io/                       (career-site shell + open-roles board)
 *   https://{tenant}.gupy.io/jobs/{jobId}           (per-role public detail / apply page)
 *
 * The career site is a Next.js application whose landing page is **server-side
 * rendered**: the full set of open roles is embedded directly in the HTML inside the
 * Next.js data island:
 *
 *   <script id="__NEXT_DATA__" type="application/json">{ … }</script>
 *
 * whose `props.pageProps.jobs` array holds every open role. The adapter extracts that
 * embedded JSON island, reads `props.pageProps.jobs`, and maps each role — rather than
 * depending on a client-rendered DOM, a headless browser, or an authenticated REST API.
 * Each role carries a numeric `id` (the stable ATS id and the final segment of the
 * canonical detail URL `/jobs/{id}`), a `title`, a `type` (vacancy type), a
 * `department`, a `quickApply` flag, and a `workplace` object with a nested
 * `address` ({ country, state, stateShortName, city, district }) and a `workplaceType`
 * (`on-site` / `hybrid` / `remote`). `props.pageProps.careerPage.name` carries the
 * tenant's display brand name.
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g. `sicredi`)
 * or by `companyUrl` (a career-site URL on a `gupy.io` host whose leading sub-domain
 * label is the tenant). An unknown tenant, a tenant with no open roles, or an empty
 * board degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS
 * failure, or a malformed body degrades to an empty / partial result rather than
 * throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.gupy.io`) and real, named
 *    tenants on it: `sicredi` (Sicredi — 891 live roles), `carreirasype` (Ypê — 108
 *    live roles), `tech-career` (Gupy Tech — 0 live roles, exercising the empty-board
 *    path).
 *  - Confirmed the SSR landing page embeds the full open-roles set in the
 *    `__NEXT_DATA__` island at `props.pageProps.jobs`, each role carrying a numeric `id`
 *    mapping to the canonical detail URL `/jobs/{id}` (a live role `/jobs/11428934`
 *    returned HTTP 200; `/job/{id}` 307-redirects to `/jobs/{id}`). verified=true.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const GUPY_ROOT_DOMAIN = 'gupy.io';

/** Hosted careers host suffix — tenant sites live at `{tenant}.gupy.io`. */
export const GUPY_CAREER_HOST_SUFFIX = '.gupy.io';

/** Builds a tenant's career-site origin from its slug. */
export const gupyCareerOrigin = (tenant: string): string =>
  `https://${tenant}${GUPY_CAREER_HOST_SUFFIX}`;

/**
 * Career-site landing paths, tried in order. The tenant's open-roles board is
 * server-rendered on the site root (`/`); the locale-prefixed roots are tried as
 * defensive fallbacks should a tenant redirect its root to a localised home. The first
 * path whose `__NEXT_DATA__` island yields a jobs array wins.
 */
export const GUPY_INDEX_PATHS: readonly string[] = ['', 'pt', 'en', 'es'];

/** Per-role public detail path segment (used to build canonical `/jobs/{id}` URLs). */
export const GUPY_JOB_PATH = 'jobs';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const GUPY_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on landing pages fetched per scrape. The SSR landing page embeds the
 * full tenant board in a single document (no server-side pagination of the job set in
 * the island), so one page is the norm; the ceiling guards the path-variant probe.
 */
export const GUPY_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Gupy career
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const GUPY_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The career site expects a browser-like UA + HTML Accept. */
export const GUPY_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

/**
 * Captures the JSON payload embedded in the Next.js data island
 * `<script id="__NEXT_DATA__" type="application/json">{ … }</script>` on the SSR career
 * landing page. The capture group is the raw JSON text (parsed directly with
 * `JSON.parse`; unlike some embedded shells it is plain JSON, not a JS string literal).
 */
export const GUPY_NEXT_DATA_REGEX =
  /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i;

/** The `workplaceType` token Gupy emits for fully-remote roles. */
export const GUPY_REMOTE_WORKPLACE_TYPE = 'remote';

/**
 * Detects remote / home-working roles across the title, location, and department fields
 * (Portuguese + English variants), complementing the structured `workplaceType` flag.
 */
export const GUPY_REMOTE_REGEX =
  /\b(remote|remoto|home[\s-]?office|trabalho\s*remoto|teletrabalho|wfh|work\s*from\s*home|fully\s*remote)\b/i;
