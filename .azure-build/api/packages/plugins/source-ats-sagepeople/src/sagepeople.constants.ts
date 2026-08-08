/**
 * Constants for the Sage People (formerly Fairsail) recruitment careers surface.
 *
 * Sage People (sage.com/people — a UK/EU-rooted enterprise cloud HCM built on the
 * Salesforce Force.com platform) powers each customer's branded, public,
 * unauthenticated candidate-facing applicant portal as a Salesforce Site on the shared
 * host `https://{tenant}.my.salesforce-sites.com/`. The portal is served by the Sage
 * People Recruit managed package (`fRecruit__` namespace), addressed by the tenant's
 * Salesforce Site sub-domain label plus a per-tenant site path segment (commonly
 * `careers` or `recruit`):
 *
 *   https://{tenant}.my.salesforce-sites.com/{path}/fRecruit__ApplyJobList   (open-roles board)
 *   https://{tenant}.my.salesforce-sites.com/{path}/fRecruit__ApplyJob?vacancyNo={VN}  (per-role detail / apply)
 *
 * The open-roles board (`fRecruit__ApplyJobList`) is a **server-rendered Visualforce
 * page**: the full set of open roles is embedded directly in the HTML as a table whose
 * rows each link to a role's detail / apply page via an anchor of the form:
 *
 *   <a href="/{path}/fRecruit__ApplyJob?vacancyNo=VN4027&portal=English">Job Title</a>
 *
 * The adapter fetches the board HTML and harvests those anchors — each `vacancyNo`
 * (e.g. `VN4027`) is the stable per-role ATS id and the canonical detail-URL key —
 * rather than depending on a client-rendered DOM, a headless browser, or an
 * authenticated Salesforce REST/SOAP API. The role title is the anchor text; the row's
 * sibling cells carry the structured location (country / office location). The board is
 * paginated server-side ("Page N of M"), so the adapter sweeps a bounded number of
 * `pageNumber`-offset pages.
 *
 * The caller addresses a tenant by `companySlug` (the Salesforce Site sub-domain label,
 * e.g. `acteonpeopleportal`) or by `companyUrl` (a portal URL on a
 * `my.salesforce-sites.com` host whose leading sub-domain label is the tenant and whose
 * first path segment is the site path). An unknown tenant, a tenant with no open roles,
 * or an empty board degrades naturally to an empty result. A fetch error, an HTTP 4xx,
 * a DNS failure, or a malformed body degrades to an empty / partial result rather than
 * throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.my.salesforce-sites.com/{path}/`)
 *    and real, named tenants on it: `acteonpeopleportal` (Acteon Group — 6 pages of live
 *    roles, path `careers`), `sagehr` (Sage — 4 pages of live roles, path `careers`),
 *    `4people` (Channel 4 — 3 live roles, path `recruit`, portal label `4 Jobs`).
 *  - Confirmed the SSR `fRecruit__ApplyJobList` board embeds the open-roles set as an
 *    HTML table whose anchors carry `fRecruit__ApplyJob?vacancyNo=VN…`, each `vacancyNo`
 *    mapping to the canonical detail URL, and the detail page (`fRecruit__ApplyJob`)
 *    carries the full role description in its body. verified=true.
 */

/** Hosted Salesforce-Sites careers host suffix — tenant portals live at `{tenant}.my.salesforce-sites.com`. */
export const SAGEPEOPLE_CAREER_HOST_SUFFIX = '.my.salesforce-sites.com';

/** Root domain token — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const SAGEPEOPLE_ROOT_DOMAIN = 'my.salesforce-sites.com';

/** Builds a tenant's Salesforce-Sites portal origin from its slug. */
export const sagePeopleCareerOrigin = (tenant: string): string =>
  `https://${tenant}${SAGEPEOPLE_CAREER_HOST_SUFFIX}`;

/**
 * Site-path segments to try in order. Sage People Recruit Salesforce Sites are mounted
 * under a per-tenant path; `careers` and `recruit` are the two overwhelmingly common
 * choices, with the bare root tried as a defensive fallback. The first path whose
 * `fRecruit__ApplyJobList` board yields role anchors wins.
 */
export const SAGEPEOPLE_SITE_PATHS: readonly string[] = ['careers', 'recruit', ''];

/** The Recruit managed-package board (open-roles list) page name. */
export const SAGEPEOPLE_JOB_LIST_PAGE = 'fRecruit__ApplyJobList';

/** The Recruit managed-package per-role detail / apply page name. */
export const SAGEPEOPLE_JOB_PAGE = 'fRecruit__ApplyJob';

/**
 * Default `portal` query parameter for the board / detail pages. Sage People portals key
 * their public listing off a `portal` label (the public default is `English`); a tenant
 * with a custom portal label (e.g. Channel 4's `4 Jobs`) still resolves its full board
 * under the default, so we request the default and let the tenant's anchors carry their
 * own `portal` value through to the detail URLs.
 */
export const SAGEPEOPLE_DEFAULT_PORTAL = 'English';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const SAGEPEOPLE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The `fRecruit__ApplyJobList` board is
 * paginated server-side ("Page N of M"); this ceiling bounds the per-tenant page sweep
 * (across both the site-path probe and the in-board pagination) so a pathological board
 * can never run unbounded.
 */
export const SAGEPEOPLE_MAX_PAGES = 12;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Salesforce-Sites
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const SAGEPEOPLE_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The portal expects a browser-like UA + HTML Accept. */
export const SAGEPEOPLE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Captures every per-role anchor on the SSR board: an `<a … href="…fRecruit__ApplyJob?…vacancyNo=VN…">Title</a>`.
 * Group 1 is the raw `href` (relative or absolute); group 2 is the inner anchor text
 * (the role title, possibly containing nested markup that is stripped downstream). The
 * `vacancyNo` itself is pulled from the captured href with `SAGEPEOPLE_VACANCY_NO_REGEX`.
 */
export const SAGEPEOPLE_JOB_ANCHOR_REGEX =
  /<a\b[^>]*\bhref="([^"]*fRecruit__ApplyJob\?[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

/** Extracts the `vacancyNo` (e.g. `VN4027`) — the stable ATS id — from a detail href. */
export const SAGEPEOPLE_VACANCY_NO_REGEX = /[?&]vacancyNo=([^&"']+)/i;

/** Extracts the `portal` label from a detail href, when the tenant carries one. */
export const SAGEPEOPLE_PORTAL_REGEX = /[?&]portal=([^&"']+)/i;

/**
 * Detects the board's "Page N of M" pagination marker so the adapter knows how many
 * board pages to sweep. Group 1 is the current page, group 2 the total page count.
 */
export const SAGEPEOPLE_PAGINATION_REGEX = /Page\s+(\d+)\s+of\s+(\d+)/i;

/**
 * Detects remote / home-working roles across the title and location text (English
 * variants — Sage People is a UK/EU-rooted enterprise HCM and its portals render in
 * English by default).
 */
export const SAGEPEOPLE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|home[\s-]?based|work\s*from\s*home|wfh|fully\s*remote|anywhere)\b/i;
