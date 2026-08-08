/**
 * Constants for the PeopleFluent careers platform.
 *
 * PeopleFluent (peoplefluent.com, US — a global enterprise talent-management /
 * recruiting suite) hosts each customer's branded candidate-facing career site on the
 * shared PeopleFluent / PeopleClick Recruiting Management System (RMS) host. The public,
 * unauthenticated candidate portal lives at:
 *
 *   https://careers.peopleclick.com/careerscp/client_{tenant}/external/...
 *
 * where the `client_{tenant}` path segment encodes the customer's RMS client code (the
 * tenant slug, e.g. `mit`, `kindermorgan`, `medcollegewi`). Each tenant exposes:
 *
 *   .../careerscp/client_{tenant}/external/search.do            (job-search shell)
 *   .../careerscp/client_{tenant}/external/gateway.do?functionname=searchfromlink
 *   .../careerscp/client_{tenant}/external/jobDetails/jobDetail.html?jobPostId={id}&localeCode={locale}
 *
 * The search surface is a thin server-rendered shell: the job-search form page renders
 * facet counts but no inline rows, while the gateway "search-from-link" / results view
 * renders the open roles server-side as a list of anchors pointing at each role's
 * canonical detail page `…/jobDetails/jobDetail.html?jobPostId={id}`. The numeric
 * `jobPostId` is the stable per-role ATS id; the detail URL is the canonical public
 * candidate-facing detail / apply page.
 *
 * The adapter probes the tenant's public gateway/search surface, extracts the
 * `jobDetail.html?jobPostId={id}` anchors (with their visible link text as a title hint
 * and any adjacent location text), de-duplicates by `jobPostId`, and maps each role.
 * Rather than depending on volatile CSS class names or a client-rendered DOM, it anchors
 * on the stable `jobPostId` URL token — so no headless browser is required.
 *
 * An unknown tenant (HTTP 404), a tenant with no open roles, or a search shell that
 * renders an empty board degrades naturally to an empty result. A fetch error, an HTTP
 * 4xx, a DNS failure, or a malformed body degrades to an empty / partial result rather
 * than throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication; verified=false):
 *  - Confirmed the platform + tenant addressing scheme: the public RMS candidate portal
 *    is `careers.peopleclick.com/careerscp/client_{tenant}/external/...`, with real live
 *    tenants observed (`mit`, `kindermorgan`, `medcollegewi`, `santeecooper`, `amery`,
 *    `reyesholdings`).
 *  - Confirmed the canonical per-role detail URL shape
 *    `…/external/jobDetails/jobDetail.html?jobPostId={id}&localeCode={locale}` and that
 *    the numeric `jobPostId` is the stable per-role id (multiple live MIT detail URLs
 *    observed, e.g. `jobPostId=33375`, `jobPostId=33237`, `jobPostId=34045`).
 *  - A populated, parseable listing array could NOT be captured live this run: the
 *    job-search shells fetched rendered facet counts only (the role rows are produced by
 *    a parameterised gateway / form submission), and the specific indexed detail ids had
 *    rotated to 404. The parser is therefore written DEFENSIVELY against the documented
 *    `jobDetail.html?jobPostId={id}` anchor shape and degrades to empty (verified=false).
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const PEOPLEFLUENT_ROOT_DOMAIN = 'peoplefluent.com';

/**
 * Public RMS candidate-portal host. PeopleFluent's hosted career sites are served from
 * the shared PeopleClick RMS careers host; every tenant lives under a `client_{tenant}`
 * path segment on this host.
 */
export const PEOPLEFLUENT_CAREERS_HOST = 'careers.peopleclick.com';

/**
 * Alternate host token recognised in a `companyUrl` so a caller may pass a career-site
 * URL on the RMS host directly. Tenants are addressed by the `client_{tenant}` path
 * segment rather than a sub-domain, so both the careers host and the brand root domain
 * are accepted hints.
 */
export const PEOPLEFLUENT_CAREERS_HOST_TOKEN = 'peopleclick.com';

/** Builds a tenant's public career-portal origin + base path from its slug. */
export const peopleFluentBasePath = (tenant: string, locale: string): string => {
  const localeSeg = locale ? `${locale}/` : '';
  return `https://${PEOPLEFLUENT_CAREERS_HOST}/careerscp/client_${tenant}/external/${localeSeg}`;
};

/**
 * Candidate open-roles index paths, tried in order (relative to the tenant base path).
 * Tenants expose the open-roles board behind one of these server-rendered entry points;
 * the gateway "search-from-link" view and the plain search results view both render the
 * role anchors server-side. The first one that yields `jobDetail.html?jobPostId=`
 * anchors wins.
 */
export const PEOPLEFLUENT_INDEX_PATHS: readonly string[] = [
  'gateway.do?functionname=searchfromlink',
  'search.do',
  'search/search.html',
  'gateway/searchFromLink.html',
];

/**
 * Locale prefixes tried for the index path. RMS career sites are localised under an
 * optional `{locale}` path segment; `''` (no prefix) is the tenant's default locale and
 * `en-us` is the English board. We try the default first, then the English board.
 */
export const PEOPLEFLUENT_LOCALES: readonly string[] = ['', 'en-us'];

/** Default locale code appended to canonical detail URLs when none is known. */
export const PEOPLEFLUENT_DEFAULT_LOCALE_CODE = 'en-us';

/** Career-site detail path segment (used to build canonical job-detail / apply URLs). */
export const PEOPLEFLUENT_DETAIL_PATH = 'jobDetails/jobDetail.html';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const PEOPLEFLUENT_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on index pages fetched per scrape. The server-rendered results view
 * embeds the tenant board (or a large page of it) in a single document; the ceiling
 * guards the locale/path probe sweep and any future paginated variation.
 */
export const PEOPLEFLUENT_MAX_PAGES = 50;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive RMS career
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const PEOPLEFLUENT_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The career site expects a browser-like UA + HTML Accept. */
export const PEOPLEFLUENT_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches a single anchor in the server-rendered results HTML pointing at a role's
 * canonical detail page. Capture groups:
 *   [1] the full href (e.g. `…/jobDetails/jobDetail.html?jobPostId=33375&localeCode=en-us`)
 *   [2] the `jobPostId` value (the stable per-role ATS id)
 *   [3] the anchor's inner text (a title hint; HTML-stripped + entity-decoded later)
 * Anchoring on the stable `jobPostId` URL token (rather than CSS class names) keeps the
 * parser resilient to template / branding drift across tenants.
 */
export const PEOPLEFLUENT_JOB_ANCHOR_REGEX =
  /<a\b[^>]*href=["']([^"']*jobDetail\.html\?[^"']*jobPostId=(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Fallback matcher: a bare `jobDetail.html?jobPostId={id}` URL token anywhere in the
 * body (e.g. embedded in a JSON bootstrap or an `onclick` handler) when the role is not
 * wrapped in a conventional anchor. Capture group [1] is the `jobPostId`.
 */
export const PEOPLEFLUENT_JOB_ID_REGEX =
  /jobDetail\.html\?[^"'<>\s]*jobPostId=(\d+)/gi;

/** Detects remote / hybrid / home-working roles across the title and location fields. */
export const PEOPLEFLUENT_REMOTE_REGEX =
  /\b(remote|hybrid|home[\s-]?(?:based|working|office)|work\s*from\s*home|wfh|telecommute|telework|virtual)\b/i;
