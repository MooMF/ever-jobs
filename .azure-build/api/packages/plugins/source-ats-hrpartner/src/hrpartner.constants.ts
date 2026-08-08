/**
 * Constants for the HR Partner careers platform.
 *
 * HR Partner (hrpartner.io — an Australia-headquartered, globally-used HR + recruitment
 * suite for SMBs) gives every customer tenant a branded, public, unauthenticated
 * candidate-facing job board on the shared host, addressed by its company slug as a
 * sub-domain of the root domain:
 *
 *   https://{tenant}.hrpartner.io/jobs                 (open-roles board)
 *   https://{tenant}.hrpartner.io/jobs/{slug}          (per-role public detail / apply page)
 *
 * The board is a **server-rendered** HTML page (Tailwind + Alpine.js progressive
 * enhancement — there is no SPA, no `__NEXT_DATA__` data island, and no public JSON API):
 * every open role is emitted directly in the markup as a `.job-listing` card. The adapter
 * parses the server-rendered cards — rather than depending on a client-rendered DOM, a
 * headless browser, or an authenticated REST API. Each card carries a title link
 * `<a href="/jobs/{slug}"><h3>{title}</h3></a>` (the slug is the stable ATS id and the
 * final segment of the canonical detail / apply URL `/jobs/{slug}`), a free-text summary
 * (`<div class="job-content">…</div>`), and a row of pill tags
 * (`<span class="…rounded-full">…</span>`): the first tag is the role location, the
 * remaining tags are the category / department. The tenant's display brand name is the
 * board page `<h1>` (mirrored in `<title>` as `{Company} | Job Board` and in the
 * `og:title` meta tag).
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g.
 * `employmentoptions`) or by `companyUrl` (a board URL on a `hrpartner.io` host whose
 * leading sub-domain label is the tenant). An unknown tenant resolves to the host's
 * catch-all empty board (HTTP 200 with no role cards) and degrades naturally to an empty
 * result; a fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an
 * empty / partial result rather than throwing, so a single bad tenant never nukes a batch
 * run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.hrpartner.io/jobs`) and real,
 *    named tenants on it: `employmentoptions` (Employment Options Inc Trading As Youth
 *    Options — 2 live roles, slug-addressed `/jobs/{slug}`), and the empty-board path via
 *    `hrpartner` (HR Partner's own board — 0 live roles).
 *  - Confirmed the board emits each role in a server-rendered `.job-listing` card with a
 *    `/jobs/{slug}` title link, a `job-content` summary, and `rounded-full` location /
 *    category pills; the brand name is the board `<h1>` / `<title>` / `og:title`. A live
 *    detail page (`/jobs/youth-options-work-placement-student-2026-d44a8`) returned HTTP
 *    200 and exposed richer OG meta + a full description body. verified=true.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const HRPARTNER_ROOT_DOMAIN = 'hrpartner.io';

/** Hosted careers host suffix — tenant boards live at `{tenant}.hrpartner.io`. */
export const HRPARTNER_CAREER_HOST_SUFFIX = '.hrpartner.io';

/** Builds a tenant's board origin from its slug. */
export const hrpartnerCareerOrigin = (tenant: string): string =>
  `https://${tenant}${HRPARTNER_CAREER_HOST_SUFFIX}`;

/** Per-role public detail path segment (also the board path: `/jobs` and `/jobs/{slug}`). */
export const HRPARTNER_JOB_PATH = 'jobs';

/**
 * Board landing paths, tried in order. The open-roles board is server-rendered at
 * `/jobs`; the bare root (`/`) is tried as a defensive fallback should a tenant front its
 * board behind a redirecting home. The first path whose HTML yields role cards wins.
 */
export const HRPARTNER_INDEX_PATHS: readonly string[] = ['jobs', ''];

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const HRPARTNER_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The server-rendered board embeds the
 * full tenant role set in a single document (no server-side pagination of the card list),
 * so one page is the norm; the ceiling guards the path-variant probe.
 */
export const HRPARTNER_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive HR Partner board
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const HRPARTNER_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The board expects a browser-like UA + HTML Accept. */
export const HRPARTNER_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-AU,en;q=0.9',
};

/**
 * Captures each role card from the server-rendered board. Every open role is wrapped in a
 * `<div class="… job-listing …">… </div>` element; this regex captures each card's inner
 * HTML (non-greedy up to the next card or the end of the listings region). Card-internal
 * fields are then extracted per-card with the field regexes below.
 */
export const HRPARTNER_CARD_REGEX =
  /class="[^"]*\bjob-listing\b[^"]*"[\s\S]*?<div class="p-6">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;

/**
 * Captures a role's title-link `<a … href="/jobs/{slug}"> … <h3 …>{title}</h3> … </a>`.
 * Group 1 is the `/jobs/{slug}` href (the slug is the stable ATS id and the canonical
 * detail / apply URL segment); group 2 is the raw `<h3>` inner HTML (the role title).
 */
export const HRPARTNER_TITLE_LINK_REGEX =
  /<a[^>]*href="(\/jobs\/[^"#?]+)"[^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>/i;

/** Fallback: any role href on the card (when the title-link shape drifts). */
export const HRPARTNER_HREF_REGEX = /href="(\/jobs\/[^"#?]+)"/i;

/** Captures the role summary body `<div class="… job-content …">{html}</div>`. */
export const HRPARTNER_SUMMARY_REGEX =
  /<div[^>]*class="[^"]*\bjob-content\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="flex items-center/i;

/**
 * Captures each pill tag `<span class="… rounded-full …">{text}</span>` on a card. The
 * first tag is the role location; subsequent tags are the category / department.
 */
export const HRPARTNER_TAG_REGEX =
  /<span[^>]*class="[^"]*\brounded-full\b[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;

/** Captures the board page `<h1>{Company}</h1>` — the tenant display brand name. */
export const HRPARTNER_H1_REGEX = /<h1[^>]*>([\s\S]*?)<\/h1>/i;

/** Captures the board `og:title` meta content (an alternate brand-name source). */
export const HRPARTNER_OG_TITLE_REGEX =
  /<meta[^>]+property="og:title"[^>]+content="([^"]*)"|<meta[^>]+content="([^"]*)"[^>]+property="og:title"/i;

/** Captures the board `<title>` (`{Company} | Job Board`) for a brand-name fallback. */
export const HRPARTNER_TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;

/** Generic `<title>` values the catch-all / empty board emits (carry no brand name). */
export const HRPARTNER_GENERIC_TITLES: readonly string[] = [
  'hr partner | company job portal',
  'hr partner | job board',
  'hr partner',
];

/**
 * Detects remote / home-working roles across the title, location, and category fields.
 * HR Partner cards carry no structured work-arrangement flag, so remoteness is inferred
 * from the role text.
 */
export const HRPARTNER_REMOTE_REGEX =
  /\b(remote|remotely|home[\s-]?office|work\s*from\s*home|wfh|fully\s*remote|telecommute|teleworking)\b/i;
