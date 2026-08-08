/**
 * Constants for the BeeSite careers platform.
 *
 * BeeSite (beesite.de) is the enterprise recruiting / applicant-management suite by
 * milch & zucker (milchundzucker.de), widely used by large German / DACH employers
 * (e.g. Fraport, Drägerwerk, Ehrmann, Universitätsmedizin Frankfurt). Each customer
 * runs a branded, public, unauthenticated candidate-facing career portal — either on
 * a milch & zucker-hosted host (`https://{slug}.beesite.de/`) or under the customer's
 * own domain on a `/cust/beesite/` path mount (`https://{host}/cust/beesite/`). The
 * portal is a classic PHP front controller addressed by an `ac` action parameter:
 *
 *   https://{host}/cust/beesite/?ac=start                 (portal home)
 *   https://{host}/index.php?ac=search_result             (open-roles search list)
 *   https://{host}/index.php?ac=jobad&id={PositionID}      (canonical per-role detail)
 *   https://{host}/index.php?ac=application&id={PositionID}(apply entry point)
 *
 * Two public surfaces expose the open roles, probed in order:
 *
 *  1. **JobBoardApi (JSON, preferred).** BeeSite ships a JSON job-board API that
 *     returns the tenant's open positions in the HR-XML "MatchedObjectDescriptor"
 *     envelope (the same schema convention milch & zucker also powers for public-sector
 *     boards):
 *
 *       GET https://{host}/search/?data={ "LanguageCode":"EN",
 *             "SearchParameters": { "FirstItem":1, "CountItem":100,
 *               "Sort":[{ "Criterion":"PublicationStartDate","Direction":"DESC" }] },
 *             "SearchCriteria":[] }
 *
 *     → { "SearchResult": { "SearchResultCount": N,
 *           "SearchResultItems": [ { "MatchedObjectId": "...",
 *             "MatchedObjectDescriptor": { "PositionID":"...", "PositionTitle":"...",
 *               "PositionURI":"...", "PositionLocation":[{ "CityName":"...",
 *               "CountryName":"..." }], "OrganizationName":"...",
 *               "PublicationStartDate":"...", "PositionFormattedDescription":{
 *               "Content":"<html>" } } }, … ] } }
 *
 *  2. **Server-rendered search list (HTML, fallback).** When the JSON API is not
 *     exposed for a tenant, the `?ac=search_result` page renders each open role in a
 *     `SearchResultBox` row whose anchor links to the `?ac=jobad&id={PositionID}`
 *     detail page. The adapter anchors on those `?ac=jobad&id=` links and reads the
 *     surrounding row text rather than depending on volatile CSS class names.
 *
 * Each role's stable ATS id is the BeeSite `PositionID` (the `id` segment of the
 * `?ac=jobad&id=` detail URL). The caller addresses a tenant by `companySlug`
 * (expanded to `https://{slug}.beesite.de`) or by `companyUrl` (any BeeSite portal
 * URL, hosted or on a custom domain; the origin is taken as-is). An unknown tenant,
 * a disabled API, an empty board, or a malformed body degrades to an empty / partial
 * result rather than throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication; verified=false):
 *  - Confirmed the platform + portal addressing via milch & zucker's own product pages
 *    and live portals: customers run a `?ac=start` PHP front controller, hosted under
 *    `{slug}.beesite.de` (demo: `frontend-demo.beesite.de`) or mounted at
 *    `/cust/beesite/` on a customer domain. A live tenant was observed:
 *    `erecruitment.draeger.com/cust/beesite/?ac=start` (Drägerwerk AG).
 *  - Confirmed the canonical per-role detail URL shape `?ac=jobad&id={PositionID}`
 *    (demo `frontend-demo.beesite.de/index.php?ac=jobad&id=89`) and the search list
 *    action `?ac=search_result` (live on the Dräger portal, which surfaced the
 *    `{"Criterion":"PublicationStartDate","Direction":"DESC"}` sort criterion).
 *  - The JobBoardApi JSON envelope (`SearchResult` / `SearchResultItems` /
 *    `MatchedObjectDescriptor` with `PositionID` / `PositionTitle` / `PositionURI` /
 *    `PositionLocation` / `PublicationStartDate`) is the documented BeeSite shape, but
 *    a populated live listing payload could not be fetched during research (the hosted
 *    `*.beesite.de` demos refused the connection from the research fetcher, and the
 *    live Dräger portal had zero active postings at fetch time), so the parser is
 *    written defensively against both the JSON and the HTML surfaces (verified=false).
 */

/** Root domain — used to recognise hosted tenant hosts / URLs passed via `companyUrl`. */
export const BEESITE_ROOT_DOMAIN = 'beesite.de';

/**
 * Builds a hosted tenant's portal origin from its slug, e.g.
 * `https://frontend-demo.beesite.de`. Used only when the caller supplies a bare
 * `companySlug` (not a full URL); a `companyUrl` is honoured verbatim.
 */
export const beesiteHostedOrigin = (slug: string): string =>
  `https://${slug}.${BEESITE_ROOT_DOMAIN}`;

/** PHP front-controller entry path on every BeeSite portal. */
export const BEESITE_INDEX_PATH = 'index.php';

/** Action parameter value for the server-rendered open-roles search list. */
export const BEESITE_SEARCH_ACTION = 'search_result';

/** Action parameter value for the canonical per-role job-ad detail page. */
export const BEESITE_JOBAD_ACTION = 'jobad';

/** Action parameter value for the per-role application (apply) entry point. */
export const BEESITE_APPLY_ACTION = 'application';

/**
 * Candidate JobBoardApi (JSON) endpoint paths, tried in order before falling back to
 * the server-rendered search list. The first that returns a parseable JSON envelope
 * with a `SearchResult` / `SearchResultItems` array wins. Different BeeSite releases
 * mount the JSON board under `/search/` or under a `/rest/api/` prefix.
 */
export const BEESITE_API_PATHS: readonly string[] = [
  'search/',
  'rest/api/search/',
];

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const BEESITE_DEFAULT_RESULTS = 100;

/**
 * Page size requested from the JobBoardApi (`CountItem`) and the hard ceiling on the
 * number of API/list pages fetched per scrape. The JSON API is paged via
 * `FirstItem` / `CountItem`; the page cap guards against an unbounded walk.
 */
export const BEESITE_PAGE_SIZE = 100;
export const BEESITE_MAX_PAGES = 50;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive BeeSite
 * portal can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in
 * well under a second. A caller may request a SHORTER timeout — we only bound the
 * upper end. (CI budget requirement: bound BOTH `timeout` and `requestTimeout`.)
 *
 * Set to 8s (vs the sibling adapters' 15s) because a dead BeeSite tenant is probed
 * across TWO sequential phases — the JobBoardApi JSON board, then the server-rendered
 * search-HTML fallback — so the worst-case wall-clock is ~2× one request. 8s keeps a
 * connect-then-hang tenant's total scrape near ~16s, comfortably inside the 30s
 * graceful-degradation E2E budget, while remaining ample for a healthy portal.
 */
export const BEESITE_DEFAULT_TIMEOUT_SECONDS = 8;

/** Default request headers. The portal expects a browser-like UA + JSON/HTML Accept. */
export const BEESITE_HEADERS: Record<string, string> = {
  Accept: 'application/json,text/html;q=0.9,application/xhtml+xml;q=0.8,*/*;q=0.7',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * BeeSite JobBoardApi languages tried in order when querying the JSON board. The API
 * keys results by `LanguageCode`; `EN` is the English board and `DE` the platform's
 * home locale. Tried in this order; the first that yields roles wins.
 */
export const BEESITE_LANGUAGES: readonly string[] = ['EN', 'DE'];

/**
 * Matches a single `?ac=jobad&id={PositionID}` job-ad anchor href in the
 * server-rendered search-list HTML, capturing the numeric/opaque `PositionID`. Tolerates
 * the `index.php` prefix being present or absent and either `&` or `&amp;` separators.
 */
export const BEESITE_JOBAD_LINK_REGEX =
  /(?:index\.php)?\?[^"'<>]*\bac=jobad\b[^"'<>]*?(?:&|&amp;)id=([A-Za-z0-9_-]+)/gi;

/**
 * Matches a single server-rendered result row container in the search-list HTML. BeeSite
 * wraps each open role in a `SearchResultBox` element; we anchor on that class to scope
 * the per-row title / location text around each `?ac=jobad&id=` link.
 */
export const BEESITE_RESULT_BOX_REGEX =
  /<(?:div|li|tr|article)\b[^>]*class="[^"]*\bSearchResultBox\b[^"]*"[^>]*>([\s\S]*?)<\/(?:div|li|tr|article)>/gi;

/** Detects remote / home-office roles across the title, location, and department fields. */
export const BEESITE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|homeoffice|mobiles?\s*arbeiten|work\s*from\s*home|wfh|telearbeit|telecommute|fully\s*remote)\b/i;
