/**
 * Constants for the Workwise recruiting platform.
 *
 * Workwise (workwise.io, Karlsruhe, Germany — formerly "Campusjäger"; a German SMB
 * recruiting platform + applicant-tracking system used by 2,000+ companies) gives every
 * customer a branded, public, candidate-facing career site on the shared host, addressed by
 * its company slug as a sub-domain of the root domain:
 *
 *   https://{tenant}.workwise.io/                       (branded careers board / job board)
 *   https://www.workwise.io/job/{id}-{slug}             (per-role public detail page)
 *
 * The branded career board (`{tenant}.workwise.io`) is a Next.js single-page app that
 * renders its open-roles list **client-side** by calling the candidate jobs-search API on
 * `https://api.workwise.io` with the browser session's credentials (the API answers the
 * CORS preflight `OPTIONS` for the tenant origin with `access-control-allow-credentials:
 * true`, and returns HTTP 405 to every un-credentialed/anonymous call). There is therefore
 * **no clean anonymous JSON list feed** the way Hirehive / Greenhouse / Lever expose one.
 *
 * What IS public + anonymous is the **per-role detail page** on the main site:
 *
 *   GET https://www.workwise.io/job/{id}-{slug}
 *
 * which is server-rendered and carries (a) a `JobPosting` JSON-LD block and (b) a full
 * `enquiry` job object inside the page's Next.js `__NEXT_DATA__` island — both readable
 * without authentication. Internally a Workwise job is an "enquiry"; the numeric `id`
 * (e.g. `121910`) is the stable per-role id and the canonical public URL is
 * `https://www.workwise.io/job/{id}-{slug}`. Each role's `company` block carries the
 * employer's numeric `id` (e.g. `47188` for aifinyo AG), `name`, and `slug`.
 *
 * The adapter is therefore **defensive**: it resolves the tenant from `companySlug` /
 * `companyUrl`, then attempts the public candidate jobs-search API to enumerate the
 * tenant's open roles. Because that API is session-gated, the list step degrades naturally
 * to an empty result for an anonymous caller; the per-role mapping (id / title / location /
 * description / employment type / posted date / canonical URL) mirrors the confirmed public
 * detail shape so the adapter maps real roles correctly the moment a list is obtainable
 * (e.g. behind a session-bearing proxy, or if Workwise later exposes an anonymous board
 * feed). An unknown tenant, an empty board, an HTTP 4xx/5xx, a DNS failure, or a malformed
 * body all degrade to an empty / partial result rather than throwing, so a single bad
 * tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - CONFIRMED the platform + tenant addressing (`{tenant}.workwise.io`, e.g.
 *    `aifinyo.workwise.io`) and the per-role public detail surface
 *    `https://www.workwise.io/job/{id}-{slug}` (e.g. `121910-backend-entwickler-ruby-on-...`):
 *    the detail page server-renders a `JobPosting` JSON-LD (`title`, `datePosted`,
 *    `employmentType: FULL_TIME`, `hiringOrganization`, `jobLocation`, `url`) and a full
 *    `enquiry` object (`id: 121910`, `slug`, `name`, `status: open`, `description`,
 *    `company: { id: 47188, name: "aifinyo AG", slug: "aifinyo-ag", … }`) anonymously.
 *  - NOT CONFIRMED an anonymous JSON list feed: `https://api.workwise.io` returns HTTP 405
 *    to every anonymous GET/POST (the candidate jobs-search API is session-gated;
 *    the tenant board renders its list client-side with credentials). The branded board
 *    HTML contains no server-rendered job links and no `ItemList` JSON-LD.
 *  - Therefore verified=FALSE: the per-role wire shape is confirmed live, but the
 *    multi-tenant anonymous LIST surface is assumed/defensive (built from the confirmed
 *    candidate-search request shape), not confirmed returning data anonymously on 2026-06-03.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const WORKWISE_ROOT_DOMAIN = 'workwise.io';

/** Hosted careers host suffix — tenant career boards live at `{tenant}.workwise.io`. */
export const WORKWISE_CAREER_HOST_SUFFIX = '.workwise.io';

/** Main public site origin — hosts the anonymous per-role detail pages `/job/{id}-{slug}`. */
export const WORKWISE_SITE_ORIGIN = 'https://www.workwise.io';

/**
 * Public candidate jobs-search API origin. The branded tenant board calls this host
 * client-side (with session credentials) to enumerate a company's open roles. The adapter
 * attempts it defensively; anonymous calls are answered HTTP 405, so the list degrades to
 * empty for an un-credentialed caller.
 */
export const WORKWISE_API_ORIGIN = 'https://api.workwise.io';

/**
 * Candidate jobs-search path on the API host. POST with a company-scoped filter body
 * (`{ filters: { companyIds: [<id>] }, page, size }`); responses are paginated.
 */
export const WORKWISE_JOBS_SEARCH_PATH = 'v1/jobs/search';

/** Builds a tenant's branded career-board origin from its slug. */
export const workwiseCareerOrigin = (tenant: string): string =>
  `https://${tenant}${WORKWISE_CAREER_HOST_SUFFIX}`;

/** Builds the canonical public detail URL for a role from its numeric id + slug. */
export const workwiseJobUrl = (id: string | number, slug?: string | null): string => {
  const idPart = String(id);
  const tail = slug && slug.trim() ? `${idPart}-${slug.trim()}` : idPart;
  return `${WORKWISE_SITE_ORIGIN}/job/${tail}`;
};

/**
 * Page size requested per search page. The candidate search paginates; we request a large
 * page so a typical SMB board drains in a single page, with pagination drained defensively
 * for larger boards.
 */
export const WORKWISE_PAGE_SIZE = 50;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const WORKWISE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on search pages fetched per scrape. The page size is large enough that most
 * tenants fit in one or two pages; the ceiling guards against an unbounded / looping
 * paginator (8 × 50 = 400 roles, well beyond any SMB board).
 */
export const WORKWISE_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Workwise host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy host responds in well under a second. A caller may
 * request a SHORTER timeout — we only bound the upper end.
 */
export const WORKWISE_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The JSON API expects a browser-like UA + JSON Accept. */
export const WORKWISE_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
};

/**
 * The schema.org `employmentType` token Workwise emits for fully-remote roles, when the
 * structured `jobLocationTypes` signal is present (Workwise uses `TELECOMMUTE`).
 */
export const WORKWISE_REMOTE_TYPE = 'telecommute';

/**
 * Detects remote / home-working roles across the title, location, and description fields,
 * complementing any structured signal Workwise emits. German + English tokens, since the
 * platform is German-SMB-facing.
 */
export const WORKWISE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|homeoffice|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|ortsunabh(ä|ae)ngig|deutschlandweit|anywhere)\b/i;
