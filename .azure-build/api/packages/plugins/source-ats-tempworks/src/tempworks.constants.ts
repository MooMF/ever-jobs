/**
 * Constants for the TempWorks staffing / applicant-tracking careers platform.
 *
 * TempWorks (tempworks.com, US) is a staffing-agency software vendor whose
 * candidate-facing product is the public "Job Board". Every customer tenant
 * publishes a branded, public, unauthenticated job board on a path segment of
 * the shared host `jobboard.ontempworks.com`:
 *
 *   https://jobboard.ontempworks.com/{tenant}
 *
 * where `{tenant}` is the agency's board id (e.g. `JustInTimeStaffing`). The
 * board is a server-rendered (ASP.NET MVC) site — not a client-side SPA — so its
 * pages are crawlable without JavaScript. The stable public surface is two-fold:
 *
 *  1. The tenant's jobs search/listing page, which renders every open order:
 *
 *       GET https://jobboard.ontempworks.com/{tenant}/Jobs/Search?Keywords=&Location=
 *         → HTML in which each open role is a card linking to its detail page:
 *             <a href="/{tenant}/Jobs/Details/{orderId}?Distance=…&SortBy=…&RowNum=…">
 *               <h3><strong>{title}</strong></h3>
 *             </a>
 *             <p><em>{city}, {state}</em> {orderType} {postedAgo}</p>
 *
 *  2. Each role's server-rendered detail page, which carries the full ad body:
 *
 *       GET https://jobboard.ontempworks.com/{tenant}/Jobs/Details/{orderId}
 *         → HTML with the role title in an <h1>, the location and ad body in the
 *           page, and an "Apply with Us" anchor pointing at the tenant's public
 *           HRCenter apply flow:
 *             <a href="https://hrcenter.ontempworks.com/en/{tenant}?orders={orderId}">
 *
 * The search page returns every open order for the tenant in one document (the
 * board paginates client-side / by scroll, but the first response enumerates the
 * orders), so we read the listing once and slice client-side to honour
 * `resultsWanted`, then enrich the wanted orders from their detail pages. An
 * unknown tenant (HTTP 404 / 4xx), a missing listing, a malformed detail page,
 * or a single bad order degrades to an empty (graceful) or partial result rather
 * than throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication):
 *  - Confirmed live the shared board host `jobboard.ontempworks.com/{tenant}`,
 *    the search path `/{tenant}/Jobs/Search`, the detail path
 *    `/{tenant}/Jobs/Details/{orderId}`, and the HRCenter apply URL
 *    `https://hrcenter.ontempworks.com/en/{tenant}?orders={orderId}`. Real,
 *    named tenants confirmed on the board host: `JustInTimeStaffing`
 *    (Just In Time Staffing), `jjstaff`, `RPM`. Detail pages render the title in
 *    an <h1> and an "Apply with Us" anchor to HRCenter.
 *  - The board carries no schema.org `JobPosting` JSON-LD, so the parser reads
 *    the server-rendered HTML (listing cards + detail body) directly. Exact
 *    per-card CSS class names vary by board theme, so field extraction is written
 *    defensively around the stable structural markers (the `/Jobs/Details/{id}`
 *    link, the heading, and the `{city}, {state}` text).
 */

/** Shared public job-board origin (every tenant lives on a path of this host). */
export const TEMPWORKS_BOARD_ORIGIN = 'https://jobboard.ontempworks.com';

/** Root board domain — used to recognise board hosts passed via `companyUrl`. */
export const TEMPWORKS_ROOT_DOMAIN = 'ontempworks.com';

/** Public HRCenter apply host (the "Apply with Us" anchor target). */
export const TEMPWORKS_HRCENTER_ORIGIN = 'https://hrcenter.ontempworks.com';

/** Public, unauthenticated jobs listing/search path (per tenant board). */
export const TEMPWORKS_SEARCH_PATH = '/Jobs/Search?Keywords=&Location=';

/** Per-tenant detail path template — `{orderId}` is substituted at fetch time. */
export const TEMPWORKS_DETAILS_PATH = '/Jobs/Details';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open orders.
 */
export const TEMPWORKS_DEFAULT_RESULTS = 100;

/** Default request headers. The board expects a browser-like UA. */
export const TEMPWORKS_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches each job card's detail link on the listing page, capturing the order
 * id. Listing links are `/{tenant}/Jobs/Details/{orderId}[?query]`; the captured
 * id is the TempWorks order id (used as the ATS id). Case-insensitive / global so
 * every card on the page is enumerated.
 */
export const TEMPWORKS_DETAIL_LINK_REGEX =
  /href=["']([^"']*\/Jobs\/Details\/(\d+)[^"']*)["']/gi;

/**
 * Recovers an order id from any TempWorks URL (`…/Jobs/Details/{id}` or an
 * HRCenter `…?orders={id}` apply link). Used when resolving a single-order
 * `companyUrl` or recovering the id from an apply link.
 */
export const TEMPWORKS_ORDER_ID_REGEX = /\/Jobs\/Details\/(\d+)|[?&]orders=(\d+)/i;

/**
 * Extracts the role title from a listing card. The card wraps the title in a
 * heading inside the detail anchor (`<h3><strong>{title}</strong></h3>`); the
 * heading level varies by board theme, so we match any `<hN>` (and strip inner
 * markup at parse time).
 */
export const TEMPWORKS_CARD_TITLE_REGEX = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i;

/**
 * Extracts the location text from a listing card — the board renders it
 * emphasised (`<em>{city}, {state}</em>`) ahead of the order type / posted-ago
 * text. Captured group is the raw `{city}, {state}` string.
 */
export const TEMPWORKS_CARD_LOCATION_REGEX = /<em[^>]*>([\s\S]*?)<\/em>/i;

/** Extracts the role title from a detail page's `<h1>…</h1>` heading. */
export const TEMPWORKS_DETAIL_TITLE_REGEX = /<h1[^>]*>([\s\S]*?)<\/h1>/i;

/** Extracts the "Apply with Us" HRCenter anchor href from a detail page. */
export const TEMPWORKS_APPLY_HREF_REGEX =
  /href=["'](https?:\/\/hrcenter\.ontempworks\.com\/[^"']+)["']/i;

/** Extracts each `<meta property="og:…" content="…">` / `<meta name="…" content="…">` value. */
export const TEMPWORKS_OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const TEMPWORKS_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const TEMPWORKS_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/**
 * Isolates the main job-description body on a detail page. Board themes wrap the
 * ad body in a container whose class includes `job-description` / `description`;
 * we match the first such block and fall back to `og:description` when absent.
 */
export const TEMPWORKS_DESCRIPTION_BLOCK_REGEX =
  /<(?:div|section)[^>]*class=["'][^"']*(?:job-?description|description|job-?details|posting)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i;

/** Detects remote / work-from-home roles across common US phrasings. */
export const TEMPWORKS_REMOTE_REGEX =
  /\b(remote|work\s*from\s*home|wfh|telecommute|telework|virtual)\b/i;
