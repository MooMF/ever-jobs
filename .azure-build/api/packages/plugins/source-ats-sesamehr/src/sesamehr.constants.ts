/**
 * Constants for the Sesame HR careers platform.
 *
 * Sesame HR (sesamehr.com / sesametime.com — a Spain/LATAM-focused all-in-one HR suite
 * with a built-in recruiting / ATS module, used by thousands of SMBs across Spain, Italy,
 * Mexico and the wider LATAM region) gives every customer tenant a branded, public,
 * unauthenticated candidate-facing career portal hosted on its shared web app, addressed by
 * the tenant's company name as a path segment:
 *
 *   https://app.sesametime.com/jobs/{company}/all                 (branded careers board)
 *   https://app.sesametime.com/jobs/{company}/{vacancyId}         (per-role public detail)
 *   https://app.sesametime.com/jobs/{company}/{vacancyId}/apply   (per-role public apply)
 *
 * That career portal is a client-rendered SPA; the role data it shows is loaded from a
 * **public, anonymous JSON API** on a region-specific backend host. The adapter calls that
 * JSON API directly — rather than driving a headless browser — in two steps:
 *
 *  1. Region detection (anonymous): the SPA first resolves which regional backend serves a
 *     company, via the public company finder:
 *
 *       GET https://login.sesametime.com/private/login-finder/v1/company/{company}
 *         → { "data": { "region": "EU1" }, "meta": { … } }
 *
 *     The region (e.g. `EU1`) maps to the backend host `back-{region-lowercased}.sesametime.com`
 *     (e.g. `back-eu1.sesametime.com`). The vast majority of tenants live on `EU1`, so the
 *     adapter defaults to `back-eu1` and only re-targets when the finder reports a different
 *     region. The finder request carries an `rsrc: 31` header (the SPA sends it).
 *
 *  2. Public vacancies feed (anonymous) on the resolved backend host:
 *
 *       GET https://back-{region}.sesametime.com/api/v3/companies/{company}/public-vacancies?page={n}
 *         → { "data": [ { …vacancy… } ],
 *             "meta": { "currentPage", "lastPage", "total", "perPage" } }
 *
 *     Each `data[]` vacancy carries a stable UUID `id`, a `name` (title), an HTML
 *     `description`, a `contractType` token (e.g. `full_time`), a `status` (`open`), an
 *     `openedAt` / `createdAt` timestamp, structured address fields (`addressCity`,
 *     `addressState`, `addressCountry` (ISO-2), `addressLine1`, `addressZip`), a `modality`
 *     token (`remoteVacancyModality` / `hybridVacancyModality` / `onsiteVacancyModality`),
 *     a `category` ({ id, name } — the department), a `scheduleType` ({ id, name } — e.g.
 *     `Jornada completa`), a `public` flag, and a `numberOfVacancies` / `totalPositions`.
 *     The endpoint requires NO bearer token. The adapter GETs this feed, drains pages via
 *     `meta.lastPage`, and maps each role. The canonical public detail / apply URL is
 *     synthesised as `https://app.sesametime.com/jobs/{company}/{id}` (and `…/apply`).
 *
 * The caller addresses a tenant by `companySlug` (the company path segment, e.g. `Sesame`)
 * or by `companyUrl` (a `app.sesametime.com/jobs/{company}/…` portal URL, from which the
 * company segment is taken). NOTE: Sesame's company segment is case-sensitive on the API
 * (`Sesame` resolves; `sesame` 404s), so — unlike sub-domain ATSes — the adapter preserves
 * the caller's casing rather than lowercasing it. An unknown tenant, a tenant with no open
 * public roles, or a disabled portal degrades naturally to an empty result. A fetch error,
 * an HTTP 4xx/5xx, a DNS failure, or a malformed body degrades to an empty / partial result
 * rather than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`app.sesametime.com/jobs/{company}/…`) and
 *    real, named tenants on it: `Sesame` (Sesame HR's own board — 36 live roles across 2
 *    pages of 20, exercising pagination) and `ForwardKeys` (a real tenant with 0 open public
 *    roles — exercises the empty-board path).
 *  - Confirmed region detection `GET login.sesametime.com/private/login-finder/v1/company/{company}`
 *    returns `{ data: { region: "EU1" } }`, and the public anonymous feed
 *    `GET https://back-eu1.sesametime.com/api/v3/companies/{company}/public-vacancies?page={n}`
 *    returns `{ data, meta }` with HTTP 200 (no bearer token), each role carrying a UUID
 *    `id` (e.g. `599a9c9f-dbac-409b-b890-c63e71d9dd2f`), an `name`, an HTML `description`,
 *    `category`, `scheduleType`, `modality`, `contractType`, and structured address fields.
 *    The per-role public page `https://app.sesametime.com/jobs/Sesame/{id}` (and `…/apply`)
 *    both answered HTTP 200. verified=true.
 */

/** Root domain — used to recognise tenant portal URLs passed via `companyUrl`. */
export const SESAMEHR_ROOT_DOMAIN = 'sesametime.com';

/** Public careers portal origin — tenant boards live at `{origin}/jobs/{company}/all`. */
export const SESAMEHR_PORTAL_ORIGIN = 'https://app.sesametime.com';

/** Public careers portal host — the SPA host whose path encodes the company segment. */
export const SESAMEHR_PORTAL_HOST = 'app.sesametime.com';

/**
 * Public, anonymous company finder used for region detection. Returns
 * `{ data: { region } }`; the region selects the backend host. No bearer token required.
 */
export const SESAMEHR_REGION_FINDER_ORIGIN = 'https://login.sesametime.com';

/** Region-finder path template (company name appended). */
export const SESAMEHR_REGION_FINDER_PATH = 'private/login-finder/v1/company';

/** Builds the regional backend origin from a region token (e.g. `EU1` → `back-eu1`). */
export const sesamehrBackendOrigin = (region: string): string =>
  `https://back-${region.toLowerCase()}.sesametime.com`;

/**
 * Default region when the finder is unreachable or omits the region. The overwhelming
 * majority of tenants are served by `EU1`, so `back-eu1.sesametime.com` is the safe default.
 */
export const SESAMEHR_DEFAULT_REGION = 'eu1';

/** Public, anonymous vacancies-feed path on the backend host (company name interpolated). */
export const sesamehrVacanciesPath = (company: string): string =>
  `api/v3/companies/${encodeURIComponent(company)}/public-vacancies`;

/**
 * Builds a tenant's public per-role detail URL on the careers portal. The portal also
 * serves an `…/apply` variant of the same page (the apply flow).
 */
export const sesamehrJobUrl = (company: string, vacancyId: string): string =>
  `${SESAMEHR_PORTAL_ORIGIN}/jobs/${encodeURIComponent(company)}/${encodeURIComponent(vacancyId)}`;

/** Builds a tenant's public per-role apply URL on the careers portal. */
export const sesamehrApplyUrl = (company: string, vacancyId: string): string =>
  `${sesamehrJobUrl(company, vacancyId)}/apply`;

/**
 * Page size the public feed returns per page. The endpoint paginates at 20 roles/page
 * (`meta.perPage`), draining further pages via `meta.lastPage`. (The feed ignores a
 * client-supplied page size, so the adapter only varies `page`.)
 */
export const SESAMEHR_PAGE_SIZE = 20;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const SESAMEHR_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed pages fetched per scrape. At 20 roles/page this drains up to 200
 * roles (10 × 20), well beyond a typical SMB board, and guards against an unbounded /
 * looping `lastPage`.
 */
export const SESAMEHR_MAX_PAGES = 10;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Sesame backend
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const SESAMEHR_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The JSON feed expects a browser-like UA + JSON Accept. */
export const SESAMEHR_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

/**
 * Header the SPA sends on the region-finder request. Mirroring it keeps us on the documented
 * public finder channel.
 */
export const SESAMEHR_REGION_FINDER_HEADERS: Record<string, string> = {
  ...SESAMEHR_HEADERS,
  rsrc: '31',
};

/**
 * The `modality` token Sesame emits for fully-remote roles (it also emits
 * `hybridVacancyModality` / `onsiteVacancyModality`).
 */
export const SESAMEHR_REMOTE_MODALITY = 'remotevacancymodality';

/**
 * The `status` token Sesame emits for live / publishable roles. Roles in other states are
 * normally absent from the public feed, but the adapter checks defensively.
 */
export const SESAMEHR_OPEN_STATUS = 'open';

/**
 * Detects remote / home-working roles across the title, location, and category fields,
 * complementing the structured `modality` signal Sesame emits. Bilingual (ES + EN) since
 * the platform is Spain/LATAM-first.
 */
export const SESAMEHR_REMOTE_REGEX =
  /\b(remote|remoto|remota|teletrabajo|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|trabajo\s*desde\s*casa|fully\s*remote|anywhere|en\s*remoto)\b/i;
