/**
 * Constants for the Access PeopleHR careers platform.
 *
 * Access PeopleHR (peoplehr.com — a UK SMB HR suite, part of The Access Group, with built-in
 * recruitment) gives each customer a branded, public, unauthenticated candidate-facing job
 * board on a per-tenant **sub-domain** of the shared host `peoplehr.net`:
 *
 *   https://{tenant}.peoplehr.net/JobBoard                       (branded board landing — current openings)
 *   https://{tenant}.peoplehr.net/Pages/JobBoard/Opening.aspx?v={GUID}   (per-role public detail / apply page)
 *
 * Unlike a slug-on-shared-host ATS, PeopleHR addresses a tenant by a sub-domain label (the
 * tenant's chosen account name, e.g. `efigroup`, `kpmg`, `britishcanoeing`) on `*.peoplehr.net`.
 * The candidate-facing board landing at `/JobBoard` is a **server-rendered HTML page**: every
 * open role is emitted inline as a table row, so the full list of current openings is available
 * from a single anonymous GET with no pagination cursor and no client-side rendering. Each row
 * carries the role's stable vacancy GUID, title, location, and department:
 *
 *   <tr class="tabletrHght" data-url="/Pages/JobBoard/Opening.aspx?v={GUID}">
 *     <td>...<span id="...lblVacancyName_{n}">{title}</span></td>
 *     <td>...<span id="...lblLocation_{n}">{location}</span></td>
 *     <td>...<span id="...lblDepartment_{n}">{department}</span></td>
 *   </tr>
 *
 * The role's canonical public detail / apply URL is the `data-url`'s `Opening.aspx?v={GUID}`
 * page resolved against the tenant sub-domain, and the `v` GUID is the stable ATS id. The
 * tenant's display company name is emitted once on the board in a `lblCompanyName` element.
 *
 * The adapter resolves the tenant sub-domain label from `companySlug` (the bare account label,
 * e.g. `efigroup`) or from a `companyUrl` on a `*.peoplehr.net` host (whose first sub-domain
 * label is the tenant), fetches the single board page, and maps every row — rather than
 * depending on a client-rendered DOM, a headless browser, or any authenticated PeopleHR API.
 * An unknown tenant, a board with no openings, or an unreachable sub-domain degrades naturally
 * to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades
 * to an empty / partial result rather than throwing, so a single bad tenant never nukes a batch
 * run.
 *
 * Surface confidence (researched + verified live 2026-06-04, no authentication):
 *  - Confirmed the platform + sub-domain addressing (`{tenant}.peoplehr.net/JobBoard`,
 *    `{tenant}.peoplehr.net/Pages/JobBoard/Opening.aspx?v={GUID}`) against multiple live
 *    tenants (`efigroup`, `kpmg`, `britishcanoeing`, `benburgess`, `scottishwoodlandsltd`).
 *  - Confirmed `GET https://efigroup.peoplehr.net/JobBoard` returns HTTP 200 server-rendered
 *    HTML whose body holds one `<tr class="tabletrHght" data-url="/Pages/JobBoard/Opening.aspx?v={GUID}">`
 *    per open role, each with `lblVacancyName_{n}` (title), `lblLocation_{n}` (location), and
 *    `lblDepartment_{n}` (department) spans, plus a single `lblCompanyName` display name — e.g.
 *    a `Cover Tutor` role at `data-url="/Pages/JobBoard/Opening.aspx?v=a6e65207-2849-4cf2-a0cb-53cdd1f9f73c"`,
 *    location `FRA`, department `Further Education`. The board is single-page (no pagination
 *    cursor — all current openings render in one table).
 *  - The per-role `Opening.aspx?v={GUID}` detail page renders its rich body client-side, so the
 *    adapter sources every field from the server-rendered board row and treats the description
 *    as unavailable (null) rather than depending on script execution. verified=true.
 */

/** Root domain — used to recognise tenant URLs passed via `companyUrl`. */
export const PEOPLEHR_ROOT_DOMAIN = 'peoplehr.net';

/**
 * Brand/product domain of the platform itself (not the tenant board host). Documented for
 * reference; tenant boards always live on the `peoplehr.net` board host.
 */
export const PEOPLEHR_BRAND_DOMAIN = 'peoplehr.com';

/** Path of the public, anonymous server-rendered board landing on a tenant sub-domain. */
export const PEOPLEHR_BOARD_PATH = '/JobBoard';

/** Path prefix of a per-role public detail / apply page on a tenant sub-domain. */
export const PEOPLEHR_OPENING_PATH = '/Pages/JobBoard/Opening.aspx';

/** Builds the public board origin (scheme + host) for a tenant sub-domain label. */
export const peoplehrBoardOrigin = (tenant: string): string =>
  `https://${tenant}.${PEOPLEHR_ROOT_DOMAIN}`;

/** Builds the public board landing URL (current openings) for a tenant sub-domain label. */
export const peoplehrBoardUrl = (tenant: string): string =>
  `${peoplehrBoardOrigin(tenant)}${PEOPLEHR_BOARD_PATH}`;

/** Builds a per-role public detail / apply URL for a tenant sub-domain label + vacancy GUID. */
export const peoplehrOpeningUrl = (tenant: string, guid: string): string =>
  `${peoplehrBoardOrigin(tenant)}${PEOPLEHR_OPENING_PATH}?v=${encodeURIComponent(guid)}`;

/**
 * Extracts the vacancy GUID from a board row's `data-url`
 * (`/Pages/JobBoard/Opening.aspx?v={GUID}`). The GUID is the stable ATS id.
 */
export const PEOPLEHR_GUID_REGEX = /[?&]v=([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const PEOPLEHR_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The PeopleHR board landing renders every
 * current opening in a single server-side page with no pagination cursor, so a single fetch
 * suffices; the ceiling exists only as a defensive guard mirroring the sibling adapters and is
 * never exceeded in practice.
 */
export const PEOPLEHR_MAX_PAGES = 1;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive PeopleHR sub-domain
 * can connect-then-hang behind its edge, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant board responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const PEOPLEHR_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The board landing is served by a standard edge in front of an
 * ASP.NET app; a browser-like UA and an HTML Accept keep us on the public anonymous board path.
 */
export const PEOPLEHR_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Detects remote / home-working roles across the title, location, and department fields the
 * board row carries.
 */
export const PEOPLEHR_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|home[\s-]?based|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
