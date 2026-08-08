/**
 * Constants for the PCRecruiter staffing/recruiting ATS public job board.
 *
 * PCRecruiter (Main Sequence Technology) is a US-focused recruiting and
 * staffing ATS. Every customer database ("tenant") can expose a public,
 * anonymous job board served from the shared host
 * `https://www2.pcrecruiter.net/pcrbin/jobboard.aspx` (other hosts such as
 * `host.pcrecruiter.net` / `www.pcrecruiter.net` serve the same application).
 *
 * Tenant identification — two equivalent forms exist, both anonymous:
 *
 *   1. **`uid` form** (human-readable, the one this adapter uses):
 *        GET …/jobboard.aspx?uid={Display Name}.{databasename}
 *      e.g. `?uid=alliance staffing.alliancestaffing`. The portion before the
 *      first dot is the tenant's display name; the portion after the last dot
 *      is the PCRecruiter database name. The server resolves this to a session
 *      and renders the first page of jobs.
 *
 *   2. **`pcr-id` form** (opaque, server-issued SessionID token):
 *        GET …/jobboard.aspx?pcr-id={base64-ish token}
 *      The board page embeds a fresh `pcr-id` token in every detail link and
 *      in the pagination form. Detail and pagination requests must carry it.
 *
 * Wire surface (server-rendered ASP.NET HTML — no public JSON API):
 *
 *   - **Listing page** (`?uid=…` or `?pcr-id=…`):
 *       Result count in `<h1 id="resultcount">1-24 of 38</h1>`.
 *       Each job is a `<table id="joblist">` whose body row carries:
 *         `<td class="td_jobtitle"><strong><a href="…&recordid={ID}&pcr-id={TOK}">{title}</a></strong></td>`
 *         `<td class="td_location">{City, ST ZIP}</td>`
 *         `<td class="td_positionid">{M/D/YYYY date posted}</td>`
 *       The page also exposes a fresh `pcr-id` token in the hidden inputs of
 *       `<form id="googlePage">` and a `unifiedsearch` cursor used for paging.
 *       Page size is fixed server-side at 24 rows.
 *
 *   - **Pagination** (`<form id="googlePage">` POST → `/pcrbin/jobboard.aspx`):
 *       Fields: `action` (empty), `showjobs=Y`, `pcr-id={TOK}`,
 *       `morecount={pageIndex*24}$${pageIndex}` (0-based pageIndex),
 *       `sortorder` (empty), `unifiedsearch={cursor token}`.
 *       This is best-effort: if the POST fails we keep page-1 results.
 *
 *   - **Detail page** (`?action=detail&recordid={ID}&pcr-id={TOK}`):
 *       The richest source is the embedded
 *       `<script type="application/ld+json">` schema.org `JobPosting`:
 *         { title, description (HTML), datePosted ("YYYY-MM-DD"),
 *           employmentType ("FULL_TIME"…), hiringOrganization: { name, logo },
 *           jobLocation: { address: { addressLocality, addressRegion,
 *             postalCode, addressCountry } }, baseSalary, directApply }
 *       As a layered fallback, the description HTML is also wrapped in
 *       `<div id="jobdesc">` between `<!-- pcr-description-start -->` and
 *       `<!-- pcr-description-end -->` markers.
 *
 * Tenant resolution: `companySlug` carries the `uid` value (e.g.
 * `alliance staffing.alliancestaffing`); `companyUrl` is a full board URL
 * (`…/jobboard.aspx?uid=…` or `…?pcr-id=…`) used verbatim when provided.
 *
 * Verified live on 2026-06-03 against
 * `https://www2.pcrecruiter.net/pcrbin/jobboard.aspx?uid=alliance staffing.alliancestaffing`:
 *   - Listing → HTTP 200, "1-24 of 38", 24 `td_jobtitle` rows with recordids.
 *   - Detail (recordid 203988647552144) → HTTP 200, full JSON-LD JobPosting
 *     with HTML description, datePosted "2026-05-29", hiringOrganization
 *     "Apollo Technical", jobLocation Spring/TX/77389/United States.
 */

/** Default shared host that serves the public job board application. */
export const PCRECRUITER_DEFAULT_HOST = 'https://www2.pcrecruiter.net';

/** Path to the job board endpoint (listing + detail + pagination). */
export const PCRECRUITER_JOBBOARD_PATH = '/pcrbin/jobboard.aspx';

/** Full default board base URL (host + path). */
export const PCRECRUITER_BOARD_BASE = `${PCRECRUITER_DEFAULT_HOST}${PCRECRUITER_JOBBOARD_PATH}`;

/** Hosts known to serve the PCRecruiter job board application. */
export const PCRECRUITER_KNOWN_HOSTS = [
  'www2.pcrecruiter.net',
  'host.pcrecruiter.net',
  'www.pcrecruiter.net',
];

/** Fixed server-side page size for the listing (24 rows per page). */
export const PCRECRUITER_PAGE_SIZE = 24;

/** Maximum number of detail-page fetches issued concurrently per page round. */
export const PCRECRUITER_MAX_CONCURRENCY = 6;

/** Maximum number of listing pages we will page through in one run. */
export const PCRECRUITER_MAX_PAGES = 20;

/** Delay (ms) between sequential pagination rounds, to stay polite. */
export const PCRECRUITER_REQUEST_DELAY_MS = 300;

/**
 * Default internal results cap. When `resultsWanted` is omitted we ingest up
 * to this many of the tenant's open roles.
 */
export const PCRECRUITER_DEFAULT_RESULTS = 100;

/** CSS selector for each job-listing table on a listing page. */
export const PCRECRUITER_JOBLIST_SELECTOR = 'table#joblist';

/** CSS selector for the title anchor within a job row. */
export const PCRECRUITER_TITLE_LINK_SELECTOR = 'td.td_jobtitle a';

/** CSS selector for the location cell within a job row. */
export const PCRECRUITER_LOCATION_SELECTOR = 'td.td_location';

/** CSS selector for the date-posted cell within a job row. */
export const PCRECRUITER_DATE_SELECTOR = 'td.td_positionid';

/** CSS selector for the schema.org JobPosting JSON-LD block on a detail page. */
export const PCRECRUITER_JSONLD_SELECTOR = 'script[type="application/ld+json"]';

/** CSS selector for the HTML description container on a detail page (fallback). */
export const PCRECRUITER_DESC_SELECTOR = 'div#jobdesc';

/** Marker comments that bracket the description HTML inside `#jobdesc`. */
export const PCRECRUITER_DESC_START_MARKER = '<!-- pcr-description-start -->';
export const PCRECRUITER_DESC_END_MARKER = '<!-- pcr-description-end -->';

/** Hidden-input id of the pagination cursor token in the listing page form. */
export const PCRECRUITER_UNIFIEDSEARCH_INPUT_ID = 'unifiedsearch';

/** Default request headers sent with every board fetch (browser-like). */
export const PCRECRUITER_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
