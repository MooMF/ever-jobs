/**
 * Constants for the Workforce.com hiring / ATS platform.
 *
 * Workforce.com (workforce.com — a US / AU / UK workforce-management + hiring platform for
 * hourly, shift-based businesses in retail, F&B, hospitality, and healthcare) powers each
 * customer's public, unauthenticated candidate-facing hiring surface on a regional host:
 *
 *   https://app.workforce.com/...                  (US / default region)
 *   https://eu.workforce.com/...                   (Europe region)
 *
 * A tenant's open roles each have a public, anonymous **job application page** addressed by
 * the role's UUID:
 *
 *   https://{region}.workforce.com/ats/apply/job/{jobUuid}            (per-role apply page)
 *   https://{region}.workforce.com/ats/apply/job/general/{jobUuid}   (general-application variant)
 *
 * The apply page is a server-rendered HTML document that carries the full role detail (title,
 * employer brand, a postal address location line, and the role description body) plus the
 * application form. A tenant also publishes a careers / open-roles page (its own site, or a
 * Workforce-hosted board) that links to those `/ats/apply/job/{uuid}` pages.
 *
 * The adapter is addressed two ways:
 *  - by `companyUrl` — a careers / open-roles board URL, OR a single
 *    `/ats/apply/job/{uuid}` apply URL. The adapter harvests every distinct
 *    `/ats/apply/job/{uuid}` link from the board HTML (a single apply URL degrades to a
 *    one-role board), then parses each role's apply page.
 *  - by `companySlug` — used to probe a defensive, Workforce-hosted board path
 *    (`/ats/{slug}` / `/careers/{slug}`) on each regional host for a tenant's open-roles
 *    page when no `companyUrl` is supplied.
 *
 * An unknown tenant, a board with no open roles, or an empty page degrades naturally to an
 * empty result. A fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an
 * empty / partial result rather than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication):
 *  - VERIFIED live: the per-role public apply page
 *    `https://eu.workforce.com/ats/apply/job/{uuid}` is anonymous and server-renders the full
 *    role detail. Confirmed against a real, named tenant — Workforce.com's own hiring
 *    (`/ats/apply/job/f384bcf7-d2b2-467a-a4b3-37752859629e` → a live "Sales Development
 *    Representative" role at Workforce.com, London, with a postal-address location line and a
 *    full description). A `/ats/apply/job/general/{uuid}` general-application variant exists.
 *  - NOT verified live: a single enumerable per-tenant board-listing JSON endpoint or a
 *    tenant-slug-addressed board on the Workforce host. The board-harvest + slug-probe paths
 *    are therefore built DEFENSIVELY from the documented apply-URL pattern. Overall surface
 *    confidence: verified=false (the role-detail surface is real; multi-tenant board
 *    enumeration is documented-but-unverified).
 */

/** Root domain — used to recognise Workforce hosts / URLs passed via `companyUrl`. */
export const WORKFORCE_ROOT_DOMAIN = 'workforce.com';

/**
 * Regional candidate-facing host suffixes, tried in order. The US / default region is
 * `app.workforce.com`; the Europe region is `eu.workforce.com`. A `companyUrl` already on a
 * Workforce host pins the region; a slug-only probe sweeps these in order.
 */
export const WORKFORCE_REGION_HOSTS: readonly string[] = [
  'app.workforce.com',
  'eu.workforce.com',
];

/** Builds a regional Workforce origin from a host. */
export const workforceOrigin = (host: string): string => `https://${host}`;

/**
 * Per-role public apply path segment. The canonical per-role public URL is
 * `{origin}/ats/apply/job/{uuid}`; the adapter both builds this URL and recognises it when
 * harvesting links from a board page.
 */
export const WORKFORCE_APPLY_PATH = 'ats/apply/job';

/**
 * Defensive Workforce-hosted board paths, tried in order when the caller supplies only a
 * `companySlug` (no `companyUrl`). The first path on the first reachable regional host whose
 * HTML yields at least one `/ats/apply/job/{uuid}` link wins. These are documented-but-
 * unverified (see the surface-confidence note above), so they are probed defensively and a
 * miss degrades cleanly to an empty result.
 */
export const WORKFORCE_BOARD_PATHS: readonly string[] = [
  'ats/{slug}',
  'careers/{slug}',
  'jobs/{slug}',
];

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const WORKFORCE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on apply-detail pages fetched per scrape. The board page is parsed from a
 * single document, but each harvested role needs a per-role detail fetch; this caps the
 * detail fan-out so a huge board can never blow the run's HTTP budget.
 */
export const WORKFORCE_MAX_DETAIL_PAGES = 50;

/**
 * Hard ceiling on board / slug-probe pages fetched per scrape. One board page is the norm;
 * the ceiling guards the regional-host x board-path probe sweep.
 */
export const WORKFORCE_MAX_BOARD_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Workforce host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy host responds in well under a second. A caller may
 * request a SHORTER timeout — we only bound the upper end.
 */
export const WORKFORCE_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The hiring site expects a browser-like UA + HTML Accept. */
export const WORKFORCE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Captures every distinct `/ats/apply/job/{uuid}` link in a board / careers page's HTML. The
 * adapter harvests these to enumerate a tenant's open roles, then parses each role's apply
 * page. The capture group is the role UUID. The optional `general/` segment is tolerated so
 * a general-application link still yields its UUID. Global + case-insensitive so all links on
 * the page are swept.
 */
export const WORKFORCE_APPLY_LINK_REGEX =
  /\/ats\/apply\/job\/(?:general\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

/**
 * Validates a bare role UUID (the stable ATS id and the apply-URL segment). Used to accept a
 * UUID passed directly via `companySlug`.
 */
export const WORKFORCE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Captures a schema.org `application/ld+json` island on a role apply page, when present.
 * Workforce role pages may embed a JobPosting structured-data block; the adapter reads it
 * (title / hiringOrganization / jobLocation / datePosted / employmentType / description) as
 * the richest mapping source and degrades to scraped text when it is absent. Global +
 * case-insensitive so multiple ld+json blocks are swept for the JobPosting one.
 */
export const WORKFORCE_LD_JSON_REGEX =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Captures the document `<title>` of a role apply page, used as a defensive title source when
 * no structured-data block is present.
 */
export const WORKFORCE_TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;

/**
 * Captures an `og:title` meta tag, a second defensive title source (the apply page sets it to
 * the role title).
 */
export const WORKFORCE_OG_TITLE_REGEX =
  /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i;

/**
 * Captures an `og:description` meta tag, used as a defensive short-description source when no
 * structured-data description is present.
 */
export const WORKFORCE_OG_DESCRIPTION_REGEX =
  /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i;

/**
 * Detects remote / home-working roles across the title, location, and description fields,
 * complementing any structured `jobLocationType` flag the ld+json block may carry.
 */
export const WORKFORCE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|wfh|work\s*from\s*home|fully\s*remote|telecommute|telework)\b/i;

/** The schema.org `jobLocationType` token denoting a fully-remote role. */
export const WORKFORCE_REMOTE_LOCATION_TYPE = 'TELECOMMUTE';
