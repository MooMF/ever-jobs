/**
 * Constants for the VidCruiter careers platform.
 *
 * VidCruiter (vidcruiter.com, Moncton NB Canada — a global video-interviewing & applicant-
 * tracking platform serving public-sector agencies, education, and enterprise) powers each
 * customer's branded, public, unauthenticated candidate-facing job board on the shared hosted
 * apply domain `hiringplatform.com`, addressed by a per-tenant **subdomain** plus a board slug:
 *
 *   https://{tenant}.hiringplatform.com/list/{slug}/                 (branded employer job board)
 *   https://{tenant}.hiringplatform.com/processes/{uuid}?locale=en   (per-role public detail / apply page)
 *
 * Unlike a path-slug ATS, VidCruiter addresses a tenant by a **subdomain** of the shared apply
 * host (e.g. `vidcruiter.hiringplatform.com`), and a tenant may publish one or more named boards
 * (the default board slug is `careers`). The candidate-facing board is a client-rendered SPA
 * backed by a single **public, anonymous JSON feed** the board itself consumes (no bearer token,
 * no cookie — an anonymous GET returns the live roster):
 *
 *   Board feed (host `{tenant}.hiringplatform.com`):
 *     GET https://{tenant}.hiringplatform.com/list/{slug}.json?page={n}
 *       → { business_processes: [ { id, name, url, country_code, state_code, city, postal_code } ] }
 *
 *   Each `business_processes[]` role carries a numeric `id` (the stable ATS id), a `name` (the
 *   title), an absolute `url` — the canonical public `/processes/{uuid}?locale=en` detail / apply
 *   page — and a structured location (`country_code` ISO-2, `state_code`, `city`, `postal_code`).
 *   The feed paginates by `?page={n}`: page 1 holds the roster and an out-of-range page returns an
 *   empty `business_processes` array, so the adapter drains pages until an empty page (bounded by
 *   a page cap). The feed carries no description, employment-type, department, or date field — the
 *   role description lives on the HTML `/processes/{uuid}` detail page — so those map to null and
 *   the role still yields a well-formed JobPostDto (title + location + canonical apply URL).
 *
 * The adapter resolves the tenant subdomain + board slug from `companySlug` or from a
 * `companyUrl` on a `hiringplatform.com` host (a `{tenant}.hiringplatform.com/list/{slug}` URL),
 * GETs the board feed, drains it page by page, and maps each role — rather than depending on a
 * client-rendered DOM, a headless browser, or any authenticated VidCruiter API. An unknown
 * tenant, a board with no roles, or an empty roster degrades naturally to an empty result. A
 * fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an empty / partial
 * result rather than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-04, no authentication):
 *  - Confirmed the platform + subdomain addressing: VidCruiter's own public board is
 *    `https://vidcruiter.hiringplatform.com/list/careers/` (the hosted apply domain is
 *    `hiringplatform.com`; the tenant is the subdomain; `careers` is the default board slug).
 *  - Confirmed `GET https://vidcruiter.hiringplatform.com/list/careers.json` returns anonymously
 *    `{ business_processes: [ { id: 396787, name: "Core Developer - Ruby on Rails",
 *    url: "https://vidcruiter.hiringplatform.com/processes/4acebf9f-…?locale=en",
 *    country_code: "CA", state_code: "NB", city: "Moncton", postal_code: "" }, … ] }`.
 *  - Confirmed `?page=2` returns `{ business_processes: [] }` (drain-until-empty pagination), and
 *    that the role `url` resolves to the public `/processes/{uuid}?locale=en` detail / apply page.
 *  - Confirmed the feed exposes no description / employment-type / date field (those degrade to
 *    null). verified=true.
 */

/** Root domain — used to recognise tenant URLs passed via `companyUrl`. */
export const VIDCRUITER_ROOT_DOMAIN = 'hiringplatform.com';

/** The VidCruiter marketing / platform domain (informational — not the candidate board host). */
export const VIDCRUITER_PLATFORM_DOMAIN = 'vidcruiter.com';

/**
 * Default board slug. A tenant may publish several named boards under
 * `{tenant}.hiringplatform.com/list/{slug}`; when the caller names only the tenant we target the
 * conventional `careers` board.
 */
export const VIDCRUITER_DEFAULT_BOARD_SLUG = 'careers';

/** Builds the public candidate-facing board host for a tenant subdomain. */
export const vidcruiterBoardHost = (tenant: string): string =>
  `${tenant}.${VIDCRUITER_ROOT_DOMAIN}`;

/** Builds the public board origin (where `/list/{slug}` and `/processes/{uuid}` pages live). */
export const vidcruiterBoardOrigin = (tenant: string): string =>
  `https://${vidcruiterBoardHost(tenant)}`;

/**
 * Builds the public, anonymous board-feed URL for a tenant subdomain, board slug, and page.
 * `GET https://{tenant}.hiringplatform.com/list/{slug}.json?page={n}`.
 */
export const vidcruiterFeedUrl = (tenant: string, slug: string, page: number): string =>
  `${vidcruiterBoardOrigin(tenant)}/list/${encodeURIComponent(slug)}.json?page=${page}`;

/** Builds the public `/list/{slug}/` board page URL on the tenant host. */
export const vidcruiterBoardPageUrl = (tenant: string, slug: string): string =>
  `${vidcruiterBoardOrigin(tenant)}/list/${encodeURIComponent(slug)}/`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const VIDCRUITER_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed pages fetched per scrape. The feed paginates with `?page={n}` and no
 * meta, so we drain until an empty page; the ceiling guards against an unbounded / looping pager
 * (public-sector tenants can post large rosters, so the cap is generous).
 */
export const VIDCRUITER_MAX_PAGES = 25;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive VidCruiter host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation well
 * inside callers' budgets; a healthy tenant responds in well under a second. A caller may request
 * a SHORTER timeout — we only bound the upper end.
 */
export const VIDCRUITER_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The board's own SPA sends a browser-like UA and a JSON Accept for
 * anonymous visitors; mirroring keeps us on the public anonymous path.
 */
export const VIDCRUITER_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Detects remote / home-working roles across the title and location text. The feed carries no
 * structured remote flag, so this is the sole signal.
 */
export const VIDCRUITER_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
