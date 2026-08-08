/**
 * Constants for the Beamery careers / talent-CRM platform.
 *
 * Beamery (beamery.com, London, UK — an enterprise Talent Lifecycle Management / talent-CRM
 * + career-site platform used by large employers such as Workday, SAP, and other enterprise
 * customers) hosts a branded, public, unauthenticated candidate-facing career site for each
 * customer tenant. The candidate-facing site is addressed by a tenant host on the shared
 * `beamery.com` domain (Beamery's own at `careers.beamery.com`, customer "flows" /
 * conversational pages at `flows.beamery.com/{tenant}/...`, and branded portals such as
 * `{tenant}.beamery.com`), or — once a customer configures one — by a fully custom vanity
 * domain that points at Beamery's `vanity.beamery.com` backend:
 *
 *   https://careers.beamery.com/                                     (Beamery's own board)
 *   https://{tenant}.beamery.com/                                    (branded tenant portal)
 *   https://careers.{tenant-domain}/                                 (custom vanity domain)
 *
 * The per-role public detail page on a Beamery careers site follows a confirmed, stable
 * pattern keyed by a role UUID + a title slug:
 *
 *   https://{host}/jobs/job/{uuid}-{title-slug}/                     (per-role public page)
 *
 * Unlike a clean JSON-feed ATS, the Beamery careers site is **server-rendered**: the listing
 * page (`/jobs/`) and the per-role pages are HTML emitted by Beamery's careers CMS, and we
 * found no clean, anonymous JSON jobs feed that the public site consumes (the only structured
 * API family is the authenticated `frontier.beamery.com` REST API, which requires a bearer
 * token, and the candidate-facing `/api/...` routes are gated — `/api/jobs` 404s and
 * `/api/v1/jobs` answers 403 without credentials). This adapter therefore queries a
 * **best-effort candidate-facing JSON route** on the tenant host and, when no anonymous JSON
 * is served, degrades to an empty result rather than scraping a brittle SSR DOM or driving a
 * headless browser. It NEVER throws — a gated / SSR-only / unknown tenant yields an empty
 * `JobResponseDto`, so a single tenant never nukes a batch run.
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g. `careers`, or a
 * branded label such as `amazon`) or by `companyUrl` (a career-site URL on a `beamery.com`
 * host whose leading sub-domain label is the tenant). An unknown tenant, a tenant with no
 * open roles, an SSR-only board, or a malformed body degrades naturally to an empty result.
 *
 * Surface confidence (researched + best-effort verified live 2026-06-04, no authentication):
 *  - CONFIRMED the platform + candidate-facing host model (`careers.beamery.com`,
 *    `{tenant}.beamery.com`, `flows.beamery.com/{tenant}`) and the per-role public detail
 *    URL pattern `https://{host}/jobs/job/{uuid}-{title-slug}/` against Beamery's own live
 *    board `careers.beamery.com` (real roles e.g.
 *    `853922ed-971c-4cc9-a430-0e772bde2a72-senior-software-engineer-data`).
 *  - NOT CONFIRMED: a clean, anonymous JSON jobs feed. The careers site is server-rendered;
 *    candidate-facing `/api/...` routes are gated (404 / 403 without auth) and the only
 *    structured API is the authenticated `frontier.beamery.com` REST API (bearer token).
 *  - Therefore this adapter is DEFENSIVE: it probes a best-effort JSON route and degrades to
 *    empty when none is served. verified=false (no anonymous JSON feed shape confirmed live).
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const BEAMERY_ROOT_DOMAIN = 'beamery.com';

/** Hosted careers host suffix — tenant sites live at `{tenant}.beamery.com`. */
export const BEAMERY_CAREER_HOST_SUFFIX = '.beamery.com';

/**
 * Builds a tenant's career-site origin from its slug. A bare label expands to
 * `{tenant}.beamery.com`; the default Beamery board lives at `careers.beamery.com`.
 */
export const beameryCareerOrigin = (tenant: string): string =>
  `https://${tenant}${BEAMERY_CAREER_HOST_SUFFIX}`;

/**
 * Best-effort candidate-facing jobs JSON route probed on the tenant career host. Beamery's
 * career sites are server-rendered and expose no confirmed anonymous JSON feed; this is the
 * most plausible candidate-facing path and is probed defensively — a non-JSON / gated / 4xx
 * response degrades to an empty result rather than throwing.
 */
export const BEAMERY_JOBS_PATH = 'api/jobs';

/**
 * Public per-role detail / apply page path segment. Confirmed live: a role page lives at
 * `https://{host}/jobs/job/{uuid}-{title-slug}/`.
 */
export const BEAMERY_JOB_PATH_PREFIX = 'jobs/job';

/** Public listing page path on the tenant career host (`/jobs/`). */
export const BEAMERY_LISTING_PATH = 'jobs';

/**
 * Page size requested per feed page when a paginated JSON route does answer. Sized generously
 * so a typical board drains in a single page, with pagination drained defensively for larger
 * boards.
 */
export const BEAMERY_PAGE_SIZE = 100;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const BEAMERY_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed pages fetched per scrape. The page size is large enough that most
 * tenants fit in one page; the ceiling guards against an unbounded / looping pagination
 * cursor (8 × 100 = 800 roles, well beyond any single enterprise board page).
 */
export const BEAMERY_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Beamery career host
 * can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well under
 * a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const BEAMERY_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The JSON probe expects a browser-like UA + JSON Accept. */
export const BEAMERY_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/** Token Beamery emits on an employment-type / location field for fully-remote roles. */
export const BEAMERY_REMOTE_TYPE = 'remote';

/**
 * Detects remote / home-working roles across the title, location, and department fields,
 * complementing any structured signal Beamery emits.
 */
export const BEAMERY_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
