/**
 * Constants for the HReasily careers platform.
 *
 * HReasily (hreasily.com — a South-East-Asian, Singapore-origin cloud HR & payroll
 * platform serving tens of thousands of employers across SG / MY / ID / TH / HK / PH /
 * KH / VN) bundles an Applicant-Tracking module in its higher product tier. Each tenant
 * that enables hiring publishes a branded, public, unauthenticated candidate-facing
 * **career page** addressed by a per-tenant **company slug**, on the platform's shared
 * careers host:
 *
 *   https://{HREASILY_CAREERS_HOST}/{slug}            (branded employer career page)
 *   https://{HREASILY_CAREERS_HOST}/{slug}/{jobId}    (per-role public detail / apply page)
 *
 * Unlike a per-tenant sub-domain ATS, HReasily addresses a tenant by a slug path on the
 * shared careers host. The candidate-facing page is server-rendered and embeds the open
 * roles as machine-readable **schema.org `JobPosting` JSON-LD** islands (one per role, or
 * a single `ItemList` of them) in the page `<head>` / `<body>` — the platform-neutral,
 * crawler-facing structured-data contract that survives template / re-brand drift. When a
 * tenant additionally exposes a server-side-rendered data island (an embedded JSON blob of
 * its open roles), the adapter reads that; otherwise it falls back to JSON-LD, and finally
 * to a light HTML extraction of role anchors. No bearer token, cookie, or CSRF token is
 * required for the anonymous candidate path.
 *
 * The adapter resolves the tenant slug from `companySlug` or from a `companyUrl` on the
 * careers host (a `/{slug}` path), GETs the tenant's public career page, parses each role,
 * and maps it — rather than depending on a client-rendered DOM, a headless browser, the
 * authenticated employer app, or any private HReasily API. An unknown slug, a tenant with
 * hiring disabled, or an empty board degrades naturally to an empty result. A fetch error,
 * an HTTP 4xx, a DNS failure, or a malformed body degrades to an empty / partial result
 * rather than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched live 2026-06-04, no authentication):
 *  - Confirmed the platform identity, the SG-origin HR/payroll footprint, and the presence
 *    of an Applicant-Tracking ("hiring") module in the higher product tier.
 *  - Confirmed the live employer application is a server-rendered app on the platform's own
 *    hosts and that its non-candidate routes are login-gated (anonymous requests redirect to
 *    a sign-in form) — i.e. the *employer* surface is private, as expected.
 *  - Could NOT confirm, anonymously and from outside the platform, the exact public
 *    candidate career-page host + slug path, nor a public machine feed, because the
 *    candidate-facing careers surface is not openly documented and was not reachable /
 *    enumerable without a tenant that has hiring enabled. The host + path shape and the
 *    JSON-LD-first parsing contract below are therefore a DEFENSIVE best-effort model built
 *    to the common platform-neutral careers-page pattern, intentionally tolerant of drift.
 *    verified=false. The adapter degrades to an empty result for every tenant until the
 *    real surface is confirmed, so a wrong guess is safe (never throws, never fabricates a
 *    role).
 */

/** Root domain — used to recognise tenant URLs passed via `companyUrl`. */
export const HREASILY_ROOT_DOMAIN = 'hreasily.com';

/**
 * Public candidate-facing careers host — tenant career pages live at
 * `{HREASILY_CAREERS_HOST}/{slug}`. Defensive best-effort (see surface-confidence note).
 */
export const HREASILY_CAREERS_HOST = 'careers.hreasily.com';

/** Public careers origin (where per-tenant `/{slug}` and `/{slug}/{jobId}` pages live). */
export const HREASILY_CAREERS_ORIGIN = `https://${HREASILY_CAREERS_HOST}`;

/** Builds the public career-page URL for a tenant slug. */
export const hreasilyCareerPageUrl = (slug: string): string =>
  `${HREASILY_CAREERS_ORIGIN}/${encodeURIComponent(slug)}`;

/** Builds a public `/{slug}/{jobId}` per-role detail / apply URL on the careers host. */
export const hreasilyJobDetailUrl = (slug: string, jobId: string): string =>
  `${HREASILY_CAREERS_ORIGIN}/${encodeURIComponent(slug)}/${encodeURIComponent(jobId)}`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const HREASILY_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on career-page fetches per scrape. The career page renders the full role set
 * in one document; should a future shape paginate, the ceiling guards against an unbounded /
 * looping pager.
 */
export const HREASILY_MAX_PAGES = 25;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds in well under a second. A caller
 * may request a SHORTER timeout — we only bound the upper end.
 */
export const HREASILY_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. Mirroring a browser-like UA and an HTML/JSON Accept keeps us on
 * the public anonymous candidate path the career page itself serves.
 */
export const HREASILY_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: `${HREASILY_CAREERS_ORIGIN}/`,
};

/** The `@type` token schema.org uses for a single open role in a JSON-LD island. */
export const HREASILY_JOBPOSTING_TYPE = 'JobPosting';

/**
 * Detects remote / home-working roles across the title, location, and department fields,
 * complementing any structured signal the role carries.
 */
export const HREASILY_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
