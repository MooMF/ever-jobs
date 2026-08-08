/**
 * Constants for the Subscribe-HR careers platform.
 *
 * Subscribe-HR (subscribe-hr.com.au — an Australian cloud HR & e-recruitment platform serving
 * employers across Australia & New Zealand) hosts each customer's branded, public,
 * unauthenticated candidate-facing careers board on a shared platform host, addressed by a
 * per-tenant **partner key** (the `pk`, e.g. `subscribehr16`) carried as the first sub-domain
 * label of the board host:
 *
 *   https://{tenant}.careers.subscribe-hr.com/                 (branded employer careers board)
 *   https://{tenant}.careers.subscribe-hr.com/?page={n}        (paginated board)
 *   https://{tenant}.careers.subscribe-hr.com/jobs/{id}-{slug} (per-role public detail / apply page)
 *
 * Unlike a JSON-feed ATS, the candidate-facing board is **server-rendered HTML** — there is no
 * separate anonymous JSON/RSS endpoint. The board itself carries every open role inline on the
 * listing page as a self-contained card, so the adapter never needs a per-role detail fetch:
 *
 *   - Each card exposes the role's stable numeric vacancy id on the apply control
 *     (`<a … data-vacancyId="{id}" class="button apply">`).
 *   - Each card carries a set of hidden inputs holding the role's clean fields:
 *       <input name='jobName' value='{title}'/>
 *       <input name='jobShortDescription' value='{summary}'/>
 *       <input name='jobUrl' value='https://{tenant}.careers.subscribe-hr.com/jobs/{id}-{slug}'/>
 *       <input name='social-url' value='…/social/?v={id}&s={tenant}&…'/>
 *   - Each card carries a `<ul>` of free-text attribute bullets (the first bullet is the role's
 *     location town, the remainder are requirement / employment-type / salary bullets), plus a
 *     short HTML summary inside `<div class="job-desc">`.
 *
 * The board paginates with a bare `?page={n}` control (5 roles per page on the boards observed);
 * the adapter walks pages until a page yields no new vacancy ids, bounded by a page cap and by
 * `resultsWanted`.
 *
 * The adapter resolves the tenant partner key from `companySlug` or from a `companyUrl` on a
 * `*.careers.subscribe-hr.com` host (the first sub-domain label), fetches the listing page(s),
 * and maps each card — rather than depending on a client-rendered DOM, a headless browser, or
 * any authenticated Subscribe-HR API. An unknown tenant, an empty board, or a malformed page
 * degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a single bad
 * tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-04, no authentication):
 *  - Confirmed the platform + partner-key addressing
 *    (`{tenant}.careers.subscribe-hr.com/`, `/jobs/{id}-{slug}`) and the inline `pk={tenant}`
 *    token baked into the board's own asset URLs.
 *  - Confirmed `GET https://subscribehr16.careers.subscribe-hr.com/` returns server-rendered
 *    HTML carrying five role cards, each with `<a … data-vacancyId="1042" class="button apply">`,
 *    `<input name='jobName' value='Aboriginal Mental Health Worker 50D'/>`,
 *    `<input name='jobShortDescription' value='…'/>`,
 *    `<input name='jobUrl' value='https://subscribehr16.careers.subscribe-hr.com/jobs/1042-gosnells-aboriginal-mental-health-worker-50d'/>`,
 *    a `<ul>` whose first bullet is `Gosnells` (the role location), and a `<div class="job-desc">`
 *    summary — anonymously.
 *  - Confirmed `GET https://subscribehr16.careers.subscribe-hr.com/?page=2` returns a DIFFERENT
 *    set of vacancy ids (1031,1032,1033,1035,1037) than page 1 (1038,1039,1040,1042,1043),
 *    i.e. `?page={n}` walk-until-empty pagination. verified=true.
 */

/** Root domain — used to recognise tenant URLs passed via `companyUrl`. */
export const SUBSCRIBEHR_ROOT_DOMAIN = 'subscribe-hr.com';

/**
 * Public candidate-facing careers-board host suffix — tenant boards live at
 * `{tenant}.careers.subscribe-hr.com`.
 */
export const SUBSCRIBEHR_BOARD_HOST_SUFFIX = 'careers.subscribe-hr.com';

/**
 * Builds the public careers-board origin for a tenant partner key (the first sub-domain label).
 */
export const subscribeHrBoardOrigin = (tenant: string): string =>
  `https://${encodeURIComponent(tenant)}.${SUBSCRIBEHR_BOARD_HOST_SUFFIX}`;

/**
 * Builds the public careers-board listing URL for a tenant and page number. The board paginates
 * with a bare `?page={n}` control.
 */
export const subscribeHrListingUrl = (tenant: string, page: number): string =>
  `${subscribeHrBoardOrigin(tenant)}/?page=${page}`;

/** Builds a public `/jobs/{id}-{slug}` detail URL on the tenant board host. */
export const subscribeHrJobUrl = (tenant: string, jobId: string, slug: string): string =>
  `${subscribeHrBoardOrigin(tenant)}/jobs/${encodeURIComponent(jobId)}-${slug}`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const SUBSCRIBEHR_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on listing pages fetched per scrape. The board paginates with a bare `?page={n}`
 * control and ~5 roles per page; the ceiling guards against an unbounded / looping pager while
 * still covering large boards (20 pages ≈ 100 roles, matching the default results cap).
 */
export const SUBSCRIBEHR_MAX_PAGES = 25;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Subscribe-HR host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds in well under a second. A caller may
 * request a SHORTER timeout — we only bound the upper end.
 */
export const SUBSCRIBEHR_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The board is plain server-rendered HTML served to anonymous
 * visitors; a browser-like UA + an HTML Accept keeps us on the public anonymous path.
 */
export const SUBSCRIBEHR_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-AU,en;q=0.9',
};

/**
 * Matches a single role card's apply control to capture the stable numeric vacancy id:
 * `<a … data-vacancyId="1042" class="button apply">`. The `data-vacancyId` attribute is the
 * authoritative ATS id for the role.
 */
export const SUBSCRIBEHR_VACANCY_ID_REGEX = /data-vacancyId=["'](\d+)["']/gi;

/**
 * Matches a card's hidden `jobName` input → the role title.
 * `<input … name='jobName' value='Aboriginal Mental Health Worker 50D'/>`
 */
export const SUBSCRIBEHR_JOB_NAME_REGEX = /name=["']jobName["'][^>]*value=["']([^"']*)["']/i;

/**
 * Matches a card's hidden `jobShortDescription` input → the role summary.
 * `<input … name='jobShortDescription' value='…'/>`
 */
export const SUBSCRIBEHR_JOB_SHORT_DESC_REGEX =
  /name=["']jobShortDescription["'][^>]*value=["']([^"']*)["']/i;

/**
 * Matches a card's hidden `jobUrl` input → the canonical public `/jobs/{id}-{slug}` detail URL.
 * `<input … name='jobUrl' value='https://{tenant}.careers.subscribe-hr.com/jobs/{id}-{slug}'/>`
 */
export const SUBSCRIBEHR_JOB_URL_REGEX = /name=["']jobUrl["'][^>]*value=["']([^"']*)["']/i;

/**
 * Matches a `/jobs/{id}-{slug}` detail path anywhere in a card, as a fallback when the hidden
 * `jobUrl` input is absent. Captures the numeric id and the trailing slug separately.
 */
export const SUBSCRIBEHR_JOB_PATH_REGEX = /\/jobs\/(\d+)-([a-z0-9][a-z0-9-]*)/i;

/**
 * Matches the free-text attribute `<li>` bullets inside a card's `<ul>`. The first bullet is
 * the role's location town; the rest are requirement / employment-type / salary bullets.
 */
export const SUBSCRIBEHR_LI_REGEX = /<li[^>]*>([\s\S]*?)<\/li>/gi;

/**
 * Matches the short HTML summary block inside a card (`<div class="job-desc">…</div>`).
 */
export const SUBSCRIBEHR_JOB_DESC_BLOCK_REGEX =
  /<div[^>]*class=["'][^"']*job-desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i;

/**
 * Detects remote / home-working roles across the title, location, attribute, and summary text,
 * since the board emits no structured remote flag.
 */
export const SUBSCRIBEHR_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;

/**
 * Detects an employment-type bullet (Full Time / Part Time / Casual / Contract / Temp /
 * Permanent / Fixed term) among a card's attribute bullets, so the adapter can surface
 * `employmentType` without a structured field.
 */
export const SUBSCRIBEHR_EMPLOYMENT_TYPE_REGEX =
  /\b(full[\s-]?time|part[\s-]?time|casual|contract|temp(?:orary)?|permanent|fixed[\s-]?term|max(?:imum)?[\s-]?term|ongoing|graduate|internship|apprentice(?:ship)?)\b/i;
