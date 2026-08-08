/**
 * Constants for the Niceboard hosted job-board platform.
 *
 * Niceboard powers the public job boards of communities, associations and
 * staffing firms. Every tenant board is served from its own sub-domain under
 * the shared apex `niceboard.co` (e.g. `https://avajobboard.niceboard.co`),
 * and some tenants front that with a custom domain.
 *
 * Two distinct REST surfaces exist:
 *
 *   1. The **private** API at `/api/v1/jobs` (and `apidirectories.niceboard.co`)
 *      requires a per-board secret `key` query param — `GET /api/v1/jobs`
 *      without it returns HTTP 401 `{"error":true,"reason":"invalid_key"}`.
 *      We deliberately do NOT use this surface; it needs credentials.
 *
 *   2. The **public, anonymous** board search API the front-end SPA itself
 *      calls to render listings:
 *
 *        GET https://{board}.niceboard.co/api/jobs
 *            ?keyword=&company=all&sortby=newest
 *            &jobtype=[]&category=[]&secondary_category=[]
 *            &city=[]&state=[]&country=[]&tags=[]&custom_fields={}
 *            &remote_ok=false&remote_only=false
 *            &salary_timeframe=&salary_min=&salary_max=
 *            &limit={n}&page={p}
 *          → { jobs: NiceboardJob[], count: number, ... aggregations }
 *
 *      Array-typed filters (`jobtype`, `category`, `city`, …) must be sent as
 *      JSON-encoded strings (`[]`) and `custom_fields` as `{}`; omitting them
 *      yields HTTP 200 `{"success":false,"error":"validation"}`. The response
 *      embeds the full job objects (incl. `description_html`), so no per-job
 *      detail fetch is needed. `count` is the tenant's total open-roles count;
 *      results paginate via `limit` + `page`.
 *
 * Verified live against `avajobboard.niceboard.co` on 2026-06-03
 * (HTTP 200, 224 jobs, fully shaped objects).
 */

/** Shared apex for every Niceboard-hosted board sub-domain. */
export const NICEBOARD_APEX = 'niceboard.co';

/** Host template for Niceboard-hosted tenants; `{board}` is substituted at runtime. */
export const NICEBOARD_HOST_TEMPLATE = 'https://{board}.niceboard.co';

/** Public, anonymous board search endpoint path (used by the board SPA itself). */
export const NICEBOARD_JOBS_PATH = '/api/jobs';

/** Public job-detail page path template (`{id}`, `{slug}`, `{companySlug}` substituted). */
export const NICEBOARD_JOB_PAGE_TEMPLATE = '/job/{id}-{slug}-{companySlug}';

/** Job-detail page path used when the employer has anonymity enabled (no company slug). */
export const NICEBOARD_JOB_PAGE_ANON_TEMPLATE = '/job/{id}-{slug}';

/** Server-side page size we request per call; combined with `page` to paginate. */
export const NICEBOARD_PAGE_SIZE = 50;

/** Maximum number of additional pages to fetch concurrently per tenant. */
export const NICEBOARD_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential pagination rounds, to stay polite. */
export const NICEBOARD_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public
 * DTO default is 15, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const NICEBOARD_DEFAULT_RESULTS = 100;

/**
 * Fixed, non-empty filter params the public `/api/jobs` endpoint requires.
 * Array filters are JSON-encoded (`[]`) and `custom_fields` is `{}`; sending an
 * incomplete set yields a `validation` error.
 */
export const NICEBOARD_BASE_PARAMS: Record<string, string> = {
  jobtype: '[]',
  category: '[]',
  secondary_category: '[]',
  company: 'all',
  city: '[]',
  state: '[]',
  country: '[]',
  remote_ok: 'false',
  remote_only: 'false',
  tags: '[]',
  salary_timeframe: '',
  salary_min: '',
  salary_max: '',
  custom_fields: '{}',
  keyword: '',
  sortby: 'newest',
};

/** Default request headers. Niceboard expects a browser-like UA + JSON accept. */
export const NICEBOARD_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
};
