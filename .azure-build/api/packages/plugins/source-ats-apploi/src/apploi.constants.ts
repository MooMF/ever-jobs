/**
 * Constants for the Apploi careers platform.
 *
 * Apploi (apploi.com, NYC — a US, healthcare / hourly-workforce applicant-tracking &
 * recruitment platform, now part of Viventium) powers each customer's branded, public,
 * unauthenticated candidate-facing job board on the shared host `https://jobs.apploi.com/`,
 * addressed by a per-tenant **company-profile slug**:
 *
 *   https://jobs.apploi.com/profile/{slug}        (branded employer job board)
 *   https://jobs.apploi.com/view/{jobId}          (per-role public detail / apply page)
 *
 * Unlike a sub-domain ATS, Apploi addresses a tenant by a profile slug (e.g. `apploi.com`)
 * on the shared `jobs.apploi.com` host. The candidate-facing board is a client-rendered SPA
 * backed by **two public, anonymous JSON APIs** the board itself consumes (no bearer token —
 * the SPA sends an empty `Authorization: Bearer ` header for anonymous visitors):
 *
 *   1. Company profile (host `api.apploi.com`):
 *        GET https://api.apploi.com/v1/company_profiles/{slug}
 *          → { data: { id, name, url_slug, team_id, teams_to_show, primary_location, … } }
 *      The `teams_to_show` field is a comma-separated list of Apploi team ids that hold the
 *      tenant's open roles. (`team_id` is the primary team; `teams_to_show` is the full set
 *      the board renders, falling back to `team_id` when absent.)
 *
 *   2. Job search (host `ats-integrations.apploi.com`):
 *        GET https://ats-integrations.apploi.com/search/jobs/?teams={csv}&page={n}&source=company_profile_page
 *          → { data: [ { …role… } ], elasticsearch_errors, errors, buckets }
 *      Each `data[]` role carries a string `id`, a `name` (the title), `city`, `state`,
 *      `address`, a structured geo `location` ({ lat, lon }), `brand_name` (company display
 *      name), `description` (HTML), `job_type` (employment type), `industry` (≈ department),
 *      `published_date` (`YYYY-MM-DD`), `published` (bool), `team_id`, salary fields, and a
 *      `redirect_apply_url` — the canonical public `jobs.apploi.com/view/{id}` detail / apply
 *      URL. The envelope carries no pagination meta, so the adapter drains pages by
 *      incrementing `page` until a page returns an empty `data` array (bounded by a page cap).
 *
 * The adapter resolves the tenant slug from `companySlug` or from a `companyUrl` on a
 * `jobs.apploi.com` host (a `/profile/{slug}` path), fetches the company profile to learn the
 * tenant's `teams_to_show`, then drains the public job-search feed for those teams and maps
 * each role — rather than depending on a client-rendered DOM, a headless browser, or any
 * authenticated Apploi API. An unknown slug, a tenant with no teams, or an empty board
 * degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a single bad
 * tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-04, no authentication):
 *  - Confirmed the platform + slug addressing (`jobs.apploi.com/profile/{slug}`,
 *    `jobs.apploi.com/view/{id}`) and the API base hosts baked into the board bundle
 *    (`api.apploi.com`, `ats-integrations.apploi.com`).
 *  - Confirmed `GET https://api.apploi.com/v1/company_profiles/apploi.com` returns
 *    `{ data: { id: 30372, name: "Apploi Corp", url_slug: "apploi.com", team_id: 30610,
 *    teams_to_show: "30610,32770,37756,41018,42745", … } }` anonymously.
 *  - Confirmed `GET https://ats-integrations.apploi.com/search/jobs/?teams=30610,…&page=1`
 *    returns `{ data: [ { id: "1736889", name: "Account Executive, Enterprise",
 *    city: "New York", state: "New York", job_type: "Full Time", industry: "Healthcare",
 *    published_date: "2026-05-12", redirect_apply_url:
 *    "https://jobs.apploi.com/view/1736889?…", … } ] }` anonymously, and that an
 *    out-of-range `page` returns an empty `data` array (drain-until-empty pagination).
 *    verified=true.
 */

/** Root domain — used to recognise tenant URLs passed via `companyUrl`. */
export const APPLOI_ROOT_DOMAIN = 'apploi.com';

/** Public candidate-facing job-board host — tenant boards live at `jobs.apploi.com/profile/{slug}`. */
export const APPLOI_BOARD_HOST = 'jobs.apploi.com';

/** Public board origin (where per-role `/view/{id}` detail pages live). */
export const APPLOI_BOARD_ORIGIN = 'https://jobs.apploi.com';

/** API host serving the public, anonymous company-profile endpoint. */
export const APPLOI_API_ORIGIN = 'https://api.apploi.com';

/** API host serving the public, anonymous job-search feed the board consumes. */
export const APPLOI_INTEGRATIONS_ORIGIN = 'https://ats-integrations.apploi.com';

/** Builds the public company-profile endpoint URL for a tenant slug. */
export const apploiProfileUrl = (slug: string): string =>
  `${APPLOI_API_ORIGIN}/v1/company_profiles/${encodeURIComponent(slug)}`;

/** Path of the public, anonymous job-search feed on the integrations host. */
export const APPLOI_SEARCH_PATH = 'search/jobs/';

/** Builds a public `/view/{id}` detail URL on the board host. */
export const apploiJobViewUrl = (jobId: string): string =>
  `${APPLOI_BOARD_ORIGIN}/view/${encodeURIComponent(jobId)}`;

/** Builds a public `/profile/{slug}` board URL on the board host. */
export const apploiProfilePageUrl = (slug: string): string =>
  `${APPLOI_BOARD_ORIGIN}/profile/${encodeURIComponent(slug)}`;

/**
 * `source` query value the tenant's own board sends for the company-profile search. Mirroring
 * it keeps us on the documented public board feed rather than any other ingest channel.
 */
export const APPLOI_SEARCH_SOURCE = 'company_profile_page';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const APPLOI_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed pages fetched per scrape. The feed paginates with no `page_size`
 * control and no meta, so we drain until an empty page; the ceiling guards against an
 * unbounded / looping pager (Apploi healthcare tenants can be large, so the cap is generous).
 */
export const APPLOI_MAX_PAGES = 25;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Apploi host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds in well under a second. A caller
 * may request a SHORTER timeout — we only bound the upper end.
 */
export const APPLOI_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The board's own SPA sends a browser-like UA, a JSON Accept, and an
 * empty bearer for anonymous visitors; mirroring keeps us on the public anonymous path.
 */
export const APPLOI_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Authorization: 'Bearer ',
  Origin: APPLOI_BOARD_ORIGIN,
  Referer: `${APPLOI_BOARD_ORIGIN}/`,
};

/** The `job_type` token Apploi emits for fully-remote roles, when present. */
export const APPLOI_REMOTE_TYPE = 'remote';

/**
 * Detects remote / home-working roles across the title, location, and industry fields,
 * complementing any structured signal Apploi emits.
 */
export const APPLOI_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
