/**
 * Constants for the Roubler careers platform.
 *
 * Roubler (roubler.com, founded 2012 — an Australian-headquartered, globally deployed
 * workforce-management, recruitment & payroll platform spanning AU / NZ / SG / MY / HK / UK)
 * powers each customer tenant's branded, public, candidate-facing careers board on the shared
 * single-page application host `https://app.roubler.com/`, addressed by a per-tenant
 * **company identifier** (a careers slug / company id). Roubler's recruitment module advertises
 * an integrated careers page that surfaces "all job vacancies via the Roubler platform"; the
 * candidate-facing board is a client-rendered application served from `app.roubler.com` and
 * region-aliased hosts (`app.roubler.com.au`, `production.roubler.net`) that all resolve to the
 * same shared application host.
 *
 * The board fetches its open-roles data from a **region-sharded careers API** under
 * `https://graphql.{region}.roubler.com/` (the AU shard `graphql.au.roubler.com` is the
 * platform's primary region; SG / MY / HK / UK shards mirror the same host pattern). That host
 * exposes a `/static/` REST namespace (the same namespace the board uses for its non-GraphQL
 * static endpoints, e.g. the public time-clock endpoints baked into the board's runtime
 * `config.js`). The adapter resolves the tenant's careers identifier, then GETs the tenant's
 * public job-advert feed and drains it page by page, bounded by a page cap, and maps each role.
 *
 *   https://app.roubler.com/careers/{companyId}          (branded employer careers board)
 *   https://app.roubler.com/careers/{companyId}/{advertId} (per-role public detail / apply page)
 *
 *   Public careers feed (region shard, e.g. AU):
 *     GET https://graphql.au.roubler.com/static/careers/{companyId}/adverts?page={n}
 *       → { data: [ { id, title, location, employmentType, description,
 *                     publishedAt, applyUrl, … } ], meta: { … } }
 *
 * The caller addresses a tenant by `companySlug` (the careers company id, e.g. `acme`) or by
 * `companyUrl` (a `app.roubler.com/careers/{companyId}` URL, from which the id is derived). An
 * unknown company id or an empty board degrades naturally to an empty result. A fetch error, an
 * HTTP 4xx, a DNS failure, or a malformed body degrades to an empty / partial result rather than
 * throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched live 2026-06-04, no authentication — verified=FALSE):
 *  - Confirmed the platform + the shared candidate-facing application host
 *    `https://app.roubler.com/` (HTTP 200; an Expo / React-Native-Web SPA served by nginx),
 *    and that the region-aliased hosts `https://app.roubler.com.au/` and
 *    `https://production.roubler.net/` both 301-redirect to it.
 *  - Confirmed the board's runtime `https://app.roubler.com/config.js` advertises a
 *    region-sharded backend host `https://graphql.au.roubler.com/` with a `/static/` REST
 *    namespace (it pins the public time-clock endpoints `/static/clock/` and
 *    `/static/clock/log/` there).
 *  - Could NOT confirm an anonymous public job-advert JSON / XML / RSS response: the board is
 *    client-rendered (its SPA shell ships an empty `<title>` and no server-rendered JobPosting
 *    JSON-LD), the `graphql.au.roubler.com/graphql` endpoint answers
 *    `{"errors":[{"name":"Authentication","message":"Access token is missing or invalid."}]}`
 *    anonymously, and every `/static/*` path answers HTTP 403 anonymously. The careers feed
 *    shape, path, and pagination below are therefore a DEFENSIVE best-effort model of the
 *    documented public careers surface, mapped through the platform's own observed hosts and
 *    namespaces only. verified=FALSE — to be re-confirmed once an anonymous careers response is
 *    captured against a live tenant.
 */

/** Root domain — used to recognise tenant URLs passed via `companyUrl`. */
export const ROUBLER_ROOT_DOMAIN = 'roubler.com';

/** Public candidate-facing careers-board host — tenant boards live at `app.roubler.com/careers/{companyId}`. */
export const ROUBLER_BOARD_HOST = 'app.roubler.com';

/** Public board origin (where per-role careers detail pages live). */
export const ROUBLER_BOARD_ORIGIN = 'https://app.roubler.com';

/**
 * Default region shard of the careers API. Roubler is region-sharded
 * (`graphql.{region}.roubler.com`); the AU shard is the platform's primary region and the one
 * advertised in the board's runtime `config.js`. A future caller could target another shard, but
 * the adapter defaults to AU.
 */
export const ROUBLER_API_REGION = 'au';

/** API origin serving the public careers feed for the default region shard. */
export const ROUBLER_API_ORIGIN = `https://graphql.${ROUBLER_API_REGION}.roubler.com`;

/** Path segment of the careers board on the shared application host. */
export const ROUBLER_CAREERS_PATH = 'careers';

/**
 * Builds the public careers-feed endpoint URL for a tenant company id + page. The feed lives in
 * the `/static/careers/{companyId}/adverts` REST namespace on the region shard.
 */
export const roublerFeedUrl = (companyId: string, page: number): string => {
  const params = new URLSearchParams({ page: String(page) });
  return `${ROUBLER_API_ORIGIN}/static/${ROUBLER_CAREERS_PATH}/${encodeURIComponent(
    companyId,
  )}/adverts?${params.toString()}`;
};

/** Builds a public `/careers/{companyId}` board URL on the board host. */
export const roublerBoardUrl = (companyId: string): string =>
  `${ROUBLER_BOARD_ORIGIN}/${ROUBLER_CAREERS_PATH}/${encodeURIComponent(companyId)}`;

/** Builds a public `/careers/{companyId}/{advertId}` per-role detail URL on the board host. */
export const roublerAdvertUrl = (companyId: string, advertId: string): string =>
  `${ROUBLER_BOARD_ORIGIN}/${ROUBLER_CAREERS_PATH}/${encodeURIComponent(
    companyId,
  )}/${encodeURIComponent(advertId)}`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const ROUBLER_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed pages fetched per scrape. The careers feed paginates with no guaranteed
 * meta, so we drain until an empty page; the ceiling guards against an unbounded / looping pager.
 */
export const ROUBLER_MAX_PAGES = 25;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Roubler host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds in well under a second. A caller may
 * request a SHORTER timeout — we only bound the upper end.
 */
export const ROUBLER_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The board's own application sends a browser-like UA and a JSON
 * Accept; mirroring keeps us on the public anonymous careers path.
 */
export const ROUBLER_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: ROUBLER_BOARD_ORIGIN,
  Referer: `${ROUBLER_BOARD_ORIGIN}/`,
};

/** The structured employment-type token Roubler emits for fully-remote roles, when present. */
export const ROUBLER_REMOTE_TYPE = 'remote';

/**
 * Detects remote / home-working roles across the title, location, and department fields,
 * complementing any structured signal Roubler emits.
 */
export const ROUBLER_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
