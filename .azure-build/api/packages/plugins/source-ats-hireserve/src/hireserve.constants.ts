/**
 * Constants for the Hireserve ATS careers platform.
 *
 * Hireserve (hireserve.com, UK) is an applicant-tracking system for in-house
 * recruitment teams. Every customer tenant publishes a branded, public,
 * unauthenticated candidate-facing careers portal powered by Hireserve's Oracle
 * PL/SQL "wd_portal" web application. A tenant portal is addressed by a **host**
 * plus a numeric **web-site id** (`p_web_site_id`); the host is one of:
 *
 *   https://{tenant}.hireserve-projects.com/      (hosted, production)
 *   https://{tenant}.hireserve-test.com/          (hosted, staging/test)
 *   https://ats8.hireserve.com/                   (shared application host)
 *
 * The candidate-facing portal exposes a **server-rendered, public,
 * unauthenticated** open-vacancies listing keyed by the web-site id:
 *
 *   GET https://{host}/wd/plsql/wd_portal.list?p_web_site_id={siteId}&p_function=map&p_title=Current+Vacancies
 *     → server-rendered HTML listing each open role as a canonical vacancy anchor
 *       of the form `/vacancy/{title-slug}-{ID}.html`, where `{ID}` is the stable
 *       Hireserve `p_web_page_id`. Card text around each anchor carries the title,
 *       and (where rendered) a location / work-type line.
 *
 * Each role's canonical public detail / apply URL is the pretty vacancy page, which
 * 301-redirects to the backing portal action:
 *
 *   https://{host}/vacancy/{title-slug}-{ID}.html
 *     → 301 → /wd/plsql/wd_portal.show_job?p_web_site_id={siteId}&p_web_page_id={ID}&p_lang=DEFAULT
 *
 * The `{ID}` segment (the `p_web_page_id`, e.g. `407240`) is the stable ATS id; the
 * pretty `/vacancy/{slug}-{ID}.html` URL is the canonical detail / apply URL. The
 * detail page is server-rendered HTML (no schema.org JSON-LD), carrying the title
 * (page heading), a reference number, an employment-type line ("Full Time fixed
 * hours"), and — when rendered — salary / location / closing-date lines. The
 * adapter parses these defensively (heading + labelled-line regexes, with `og:` /
 * `<title>` fallbacks) rather than depending on volatile CSS class names.
 *
 * The caller addresses a tenant by `companyUrl` (any portal URL on a Hireserve host
 * that carries the `p_web_site_id`, or a `/vacancy/{slug}-{ID}.html` URL), or by a
 * `companySlug` of the form `{host}:{siteId}` / `{tenant}:{siteId}` / a full portal
 * URL. Because the listing is keyed by the numeric site id (not a bare slug), a bare
 * slug without a site id cannot be resolved and degrades to an empty result. An
 * unknown tenant / site id renders an "Unauthorised" or empty portal page, so it
 * degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure,
 * or a malformed body degrades to an empty / partial result rather than throwing, so
 * a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (Hireserve "wd_portal" PL/SQL portal
 *    on `{tenant}.hireserve-projects.com` / `.hireserve-test.com` / `ats8.hireserve.com`,
 *    keyed by `p_web_site_id`) and a real, named live tenant on it: the **University
 *    of Hireserve** demo portal at
 *    `https://university.hireserve-projects.com/` (`p_web_site_id=2624`), with 14
 *    open roles at the time of research (e.g. Business Analyst, Finance Officer,
 *    Operations Manager).
 *  - Confirmed the server-rendered listing
 *    (`wd_portal.list?p_function=map&p_title=Current+Vacancies&p_web_site_id={id}`)
 *    lists each role with the canonical vacancy URL shape
 *    `/vacancy/{slug}-{ID}.html` (e.g. `/vacancy/business-analyst-407240.html`) and
 *    that the pretty URL 301-redirects to
 *    `wd_portal.show_job?p_web_site_id={id}&p_web_page_id={ID}` (verified=true).
 *    Other live Hireserve hosts seen: `ats8.hireserve.com` (`p_web_site_id=3`),
 *    `ska.hireserve-projects.com`, `stepchange.hireserve-test.com`,
 *    `cityandguilds-base.hireserve-test.com`.
 */

/** Shared Hireserve application host (a fallback portal host). */
export const HIRESERVE_BASE = 'https://ats8.hireserve.com';

/** Root domains — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const HIRESERVE_ROOT_DOMAINS = [
  'hireserve-projects.com',
  'hireserve-test.com',
  'hireserve.com',
] as const;

/**
 * Public, server-rendered open-vacancies listing path (the "wd_portal.list" action).
 * Keyed by `p_web_site_id`; lists every open role with its canonical vacancy URL.
 * This is the enumeration / scraping surface.
 */
export const HIRESERVE_LIST_PATH = '/wd/plsql/wd_portal.list';

/** The "map" listing function renders the full current-vacancies set in one document. */
export const HIRESERVE_LIST_QUERY = 'p_function=map&p_title=Current+Vacancies';

/** Backing portal action path for a single role (the pretty `/vacancy/` URL redirects here). */
export const HIRESERVE_SHOW_JOB_PATH = '/wd/plsql/wd_portal.show_job';

/** Pretty, candidate-facing canonical vacancy path prefix (`/vacancy/{slug}-{ID}.html`). */
export const HIRESERVE_VACANCY_PATH = '/vacancy/';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const HIRESERVE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on listing pages fetched per scrape. The "map" listing renders the
 * full tenant board in a single document, so one page is the norm; the ceiling
 * guards any future server-side pagination.
 */
export const HIRESERVE_MAX_PAGES = 50;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. Some legacy Hireserve
 * `wd_portal` hosts can connect-then-hang, so we cap the shared client's 60s
 * default to keep graceful-degradation well inside callers' budgets; a healthy
 * tenant responds in well under a second. A caller may request a SHORTER timeout
 * — we only bound the upper end.
 */
export const HIRESERVE_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The portal expects a browser-like UA + HTML Accept. */
export const HIRESERVE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Matches a canonical Hireserve vacancy anchor inside the listing HTML, capturing
 * the title slug and the trailing numeric `p_web_page_id` (the ATS id):
 *   /vacancy/{title-slug}-{ID}.html
 */
export const HIRESERVE_VACANCY_LINK_REGEX =
  /\/vacancy\/([a-z0-9][a-z0-9-]*?)-(\d+)\.html/gi;

/**
 * Matches a backing `wd_portal.show_job` action URL (used as a defensive fallback
 * if the pretty `/vacancy/` form is not emitted), capturing the `p_web_page_id`.
 */
export const HIRESERVE_SHOW_JOB_LINK_REGEX =
  /wd_portal\.show_job\?[^"'\s]*?p_web_page_id=(\d+)/i;

/** Detects remote / home-working roles across the title, location, and work-type fields. */
export const HIRESERVE_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
