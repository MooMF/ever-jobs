/**
 * Constants for the Symphony Talent / SmashFlyX career-site platform.
 *
 * Symphony Talent (symphonytalent.com — an enterprise recruitment-marketing / candidate-CRM
 * vendor that absorbed SmashFly Technologies; its flagship product is SmashFlyX) powers each
 * customer's branded, public, unauthenticated candidate-facing career site. Every such site
 * (the "CWS" career-website widget that renders the job board) consumes one shared, public,
 * anonymous JSON jobs API on Symphony Talent's hosting cloud (`m-cloud.io`), addressing the
 * tenant purely by a **numeric organisation id** (`Organization` / `org_id`):
 *
 *   GET https://jobsapi-internal.m-cloud.io/api/job?Organization={orgId}&Limit={n}&offset={k}
 *
 * The endpoint requires no bearer token / API key (the tenant's own public career site calls
 * it cross-origin as JSONP; it also answers a plain `GET` with `Content-Type: application/json`).
 * It returns a flat envelope:
 *
 *   { "aggregations": …, "titles": …, "totalHits": <int>, "queryResult": [ { …job… } ] }
 *
 * where each `queryResult[]` role carries a numeric `id`, a `title`, an HTML `description`,
 * structured location (`primary_city`, `primary_state`, `primary_country`, `primary_zip`,
 * `primary_address`, plus `addtnl_locations`), a `department` and `primary_category`
 * (department / job-family labels), an `employment_type`, a `location_type` (e.g. `Remote`,
 * `Onsite`, `Hybrid`), an `open_date` (ISO publish timestamp), a `company_name` (the tenant
 * brand — the feed DOES carry it, unlike many ATS feeds), a canonical public `url` (the
 * career-site detail page `{careerHost}/job/{id}/{seo-slug}`), and an `fndly_url` apply /
 * tracking link. The adapter GETs this feed, walks `offset` to drain pages bounded by
 * `totalHits`, and maps each role — rather than depending on a client-rendered DOM, a
 * headless browser, or the authenticated SmashFly Console / Job-Import REST API (which DO
 * require credentials).
 *
 * The caller addresses a tenant by `companySlug` — the numeric `Organization` id (e.g.
 * `2015`) — or by `companyUrl`, which may be either the API host carrying an
 * `Organization=` query param, or a numeric id embedded in the path. An unknown org id, an
 * org with no open roles, or an empty board degrades naturally to an empty result. A fetch
 * error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an empty / partial
 * result rather than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the shared public jobs API `GET https://jobsapi-internal.m-cloud.io/api/job`
 *    and the tenant addressing model (`Organization={numeric org_id}`) by reading the live
 *    Symphony Talent career-site widget (`careers.symphonytalent.com` injects
 *    `org_id: "2015"`, `api: https://jobsapi-internal.m-cloud.io/api/`, the CWS jobs widget
 *    builds `criteria.Organization = options.org_id`, `criteria.Limit`, `criteria.offset`).
 *  - Confirmed the feed live for `Organization=2015`: a plain `GET ...?Organization=2015&Limit=3&offset=1`
 *    returned HTTP 200 `application/json` with `{ totalHits: 3, queryResult: [ … ] }`, each
 *    role carrying a numeric `id` (e.g. `23398009`), an HTML `description`, `primary_city` /
 *    `primary_state` / `primary_country`, `department`, `employment_type`, `location_type`
 *    (`Remote`), `open_date`, `company_name` (`Symphony Talent`), and a canonical public
 *    `url` (`https://careers.symphonytalent.com/job/23398009/technical-project-manager-us-remote-remote/`).
 *    verified=true.
 */

/** Root vendor domain — Symphony Talent's marketing / brand domain. */
export const SYMPHONYTALENT_ROOT_DOMAIN = 'symphonytalent.com';

/**
 * Host of the shared, public, anonymous SmashFlyX career-site jobs API on Symphony Talent's
 * hosting cloud. Every tenant's public career site consumes this single host, addressing its
 * own org by the `Organization` query param.
 */
export const SYMPHONYTALENT_API_HOST = 'jobsapi-internal.m-cloud.io';

/** Origin of the public jobs API (`https://jobsapi-internal.m-cloud.io`). */
export const SYMPHONYTALENT_API_ORIGIN = `https://${SYMPHONYTALENT_API_HOST}`;

/** Public, anonymous jobs-feed path on the API host (`/api/job`). */
export const SYMPHONYTALENT_JOBS_PATH = 'api/job';

/** Builds the public jobs-feed URL origin + path (`https://jobsapi-internal.m-cloud.io/api/job`). */
export const symphonytalentFeedBase = (): string =>
  `${SYMPHONYTALENT_API_ORIGIN}/${SYMPHONYTALENT_JOBS_PATH}`;

/**
 * Page size requested per feed page (the `Limit` query param). The board is drained by
 * advancing `offset`; a large page size means most boards fit in one or two requests, with
 * pagination drained defensively for larger enterprise catalogues.
 */
export const SYMPHONYTALENT_PAGE_SIZE = 100;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const SYMPHONYTALENT_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed pages fetched per scrape. Guards against an unbounded / mis-reported
 * `totalHits` (10 × 100 = 1000 roles, well beyond all but the very largest enterprise
 * catalogues, which are sliced to `resultsWanted` anyway).
 */
export const SYMPHONYTALENT_MAX_PAGES = 10;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive API host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy feed responds in well under a second. A caller may
 * request a SHORTER timeout — we only bound the upper end.
 */
export const SYMPHONYTALENT_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The JSON feed expects a browser-like UA + JSON Accept. */
export const SYMPHONYTALENT_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** The `location_type` token Symphony Talent emits for fully-remote roles, when present. */
export const SYMPHONYTALENT_REMOTE_TYPE = 'remote';

/**
 * Detects remote / home-working roles across the title, location, and category fields,
 * complementing the structured `location_type` signal.
 */
export const SYMPHONYTALENT_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
