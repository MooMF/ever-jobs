/**
 * Constants for the Hirehive careers platform.
 *
 * Hirehive (hirehive.com, Cork, Ireland — an EU/Irish SMB applicant-tracking system used
 * by hundreds of companies) powers each customer's branded, public, unauthenticated
 * candidate-facing career site on the shared host, addressed by its company slug as a
 * sub-domain of the root domain:
 *
 *   https://{tenant}.hirehive.com/                                  (branded careers board)
 *   https://{tenant}.hirehive.com/{title}-{location}-{shortId}      (per-role public page)
 *
 * Each tenant career site is backed by a **public, anonymous JSON API** on the same host:
 *
 *   GET https://{tenant}.hirehive.com/api/v2/jobs?page={n}&page_size={k}&source=CareerSite
 *
 * The endpoint advertises `security: []` (no bearer token) in the published OpenAPI spec
 * and is the exact feed the tenant's own career site consumes. It returns a JSON:API-style
 * envelope:
 *
 *   { "meta":  { "page", "page_size", "total_items", "total_pages",
 *                "has_next_page", "has_previous_page" },
 *     "links": { "first", "last", "next", "previous" },
 *     "items": [ { …job… } ] }
 *
 * where each `items[]` role carries a stable string `id` (e.g. `job_QxZUlo`), a `title`, a
 * `location`, a `state_code`, a `country` ({ name, code }), a `salary`, a `description`
 * ({ html, text }), a `category` ({ id, name }), a `type` ({ type, name } — employment
 * type), an `experience` ({ type, name }), a `language` ({ name, code }), a
 * `published_date`, a `created_date`, a `hosted_url` (the canonical public detail / apply
 * page), and `compensation_tiers`. The adapter GETs this feed, walks `meta.has_next_page`
 * to drain pages, and maps each role — rather than depending on a client-rendered DOM, a
 * headless browser, or the authenticated `api.hirehive.com` REST API (which DOES require a
 * bearer token).
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g. `hirehive`)
 * or by `companyUrl` (a career-site URL on a `hirehive.com` host whose leading sub-domain
 * label is the tenant). An unknown tenant, a tenant with no open roles, or an empty board
 * degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a single
 * bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.hirehive.com`) and real, named
 *    tenants on it: `hirehive` (HireHive itself — 1 live role, the "Speculative
 *    Application"), `hirehive-testing-account` (HireHive demo — 11 live roles across
 *    multiple pages, exercising pagination), and `amcsgroup` (AMCS Group).
 *  - Confirmed the public anonymous JSON feed `GET /api/v2/jobs` returns
 *    `{ meta, links, items }`, each role carrying a string `id` (e.g. `job_fVDsSf`,
 *    `job_QxZUlo`) and a `hosted_url` that is the canonical public detail page
 *    `https://{tenant}.hirehive.com/{title}-{location}-{shortId}`. verified=true.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const HIREHIVE_ROOT_DOMAIN = 'hirehive.com';

/** Hosted careers host suffix — tenant sites live at `{tenant}.hirehive.com`. */
export const HIREHIVE_CAREER_HOST_SUFFIX = '.hirehive.com';

/** Builds a tenant's career-site origin from its slug. */
export const hirehiveCareerOrigin = (tenant: string): string =>
  `https://${tenant}${HIREHIVE_CAREER_HOST_SUFFIX}`;

/** Public, anonymous jobs-feed path on the tenant career host (`/api/v2/jobs`). */
export const HIREHIVE_JOBS_PATH = 'api/v2/jobs';

/**
 * `source` query value the tenant's own career site sends. Mirroring it keeps us on the
 * documented public CareerSite feed rather than any other ingest channel.
 */
export const HIREHIVE_SOURCE = 'CareerSite';

/**
 * Page size requested per feed page. The endpoint caps `page_size` at 100; we request the
 * max so a typical board drains in a single page, with pagination drained defensively for
 * larger boards.
 */
export const HIREHIVE_PAGE_SIZE = 100;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const HIREHIVE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed pages fetched per scrape. The page size is large enough that most
 * tenants fit in one page; the ceiling guards against an unbounded / looping
 * `has_next_page` (8 × 100 = 800 roles, well beyond any SMB board).
 */
export const HIREHIVE_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Hirehive career
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const HIREHIVE_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The JSON feed expects a browser-like UA + JSON Accept. */
export const HIREHIVE_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-IE,en;q=0.9',
};

/** The employment-`type.type` token Hirehive emits for fully-remote roles, when present. */
export const HIREHIVE_REMOTE_TYPE = 'remote';

/**
 * Detects remote / home-working roles across the title, location, and category fields,
 * complementing any structured signal Hirehive emits.
 */
export const HIREHIVE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
