/**
 * Constants for the Oleeo (TAL.net) candidate recruitment platform.
 *
 * Oleeo (oleeo.com, UK) is an enterprise e-recruitment / ATS vendor (formerly
 * WCN / "tal.net") widely used across the UK public sector, policing, government,
 * and financial-services firms. Every customer tenant publishes a branded, public,
 * unauthenticated candidate careers portal on its own sub-domain of the shared
 * application host:
 *
 *   https://{tenant}.tal.net/
 *
 * The candidate-facing job board is **server-rendered HTML** reached at the stable,
 * brand-agnostic short path:
 *
 *   GET https://{tenant}.tal.net/candidate/jobboard/vacancy/1/adv/
 *     → server-rendered HTML listing every open opportunity as a canonical anchor
 *       of the form
 *         https://{tenant}.tal.net/vx/lang-en-GB/mobile-0/appcentre-{n}/brand-{n}/
 *           xf-{token}/candidate/so/pm/4/pl/1/opp/{ID}-{title-slug}/en-GB
 *       The opaque-but-numeric `{ID}` segment (e.g. `26870`) is the stable ATS id,
 *       and the anchor is the canonical detail / apply URL. The board renders the
 *       full open-roles set in one document (with `?start=` paging for large boards).
 *
 * Each opportunity's canonical public detail / apply URL is its `/opp/{ID}-{slug}`
 * page, which carries the role title, location, free-text body, employment type,
 * and a closing date (server-rendered HTML; no schema.org JSON-LD is emitted).
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g.
 * `fcdo`) or by `companyUrl` (any portal URL on a `tal.net` host, whose leading
 * sub-domain label is the tenant). An unknown tenant resolves to a non-existent
 * host (DNS failure) or an empty board, so it degrades naturally to an empty
 * result. A fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades
 * to an empty / partial result rather than throwing, so one bad tenant never nukes
 * a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.tal.net`, board reached
 *    at the brand-agnostic `…/candidate/jobboard/vacancy/1/adv/`) and a real, named
 *    tenant on it: `fcdo` (UK Foreign, Commonwealth & Development Office —
 *    `https://fcdo.tal.net/`, 68 open opportunities at time of research).
 *  - Confirmed the server-rendered board lists each role with the canonical detail
 *    URL shape `…/opp/{ID}-{title-slug}/en-GB` (e.g.
 *    `/opp/26870-Post-Security-Manager-SRB26-006248/en-GB`), the leading numeric
 *    `{ID}` segment being the stable per-role ATS id (verified=true). Other live
 *    Oleeo/tal.net tenants seen: `fco`, `homeofficejobs`, `environmentagencyjobs`,
 *    `oleeo-jobs`.
 */

/** Shared application host suffix for every Oleeo (tal.net) tenant sub-domain. */
export const OLEEO_ROOT_DOMAIN = 'tal.net';

/** URL scheme + host template for a tenant's public candidate portal. */
export const OLEEO_HOST_TEMPLATE = 'https://{tenant}.tal.net';

/**
 * Stable, brand-agnostic server-rendered job-board path. Keyed implicitly by the
 * tenant host; lists every open opportunity with its canonical detail anchor. This
 * is the scraping (enumeration) surface.
 */
export const OLEEO_BOARD_PATH = '/candidate/jobboard/vacancy/1/adv/';

/** Canonical detail-URL path token (`…/opp/{ID}-{slug}/en-GB`) used to build/parse role links. */
export const OLEEO_OPP_PATH_TOKEN = '/opp/';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open opportunities.
 */
export const OLEEO_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The board renders the full tenant
 * set in one document; larger boards page via `?start=` (50 roles/page), so the
 * ceiling bounds that walk and guards any future pagination drift.
 */
export const OLEEO_MAX_PAGES = 50;

/** Page size used when walking a paged board via the `?start=` offset parameter. */
export const OLEEO_PAGE_SIZE = 50;

/** Default request headers. The board expects a browser-like UA + HTML Accept. */
export const OLEEO_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Matches a canonical Oleeo (tal.net) opportunity link inside the board HTML,
 * capturing the numeric vacancy id and the title slug:
 *   …/opp/{ID}-{title-slug}/en-GB
 * The leading numeric `{ID}` is the stable ATS id; the remainder (up to `/en-GB`,
 * a `"`, `'`, `?`, `#`, or whitespace) is the human-readable title slug.
 */
export const OLEEO_OPP_LINK_REGEX =
  /\/opp\/(\d+)-([^/"'?#\s]+)(?:\/[a-z]{2}-[A-Z]{2})?/gi;

/** Detects remote / home-working roles across the title, location, and body fields. */
export const OLEEO_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;

/**
 * Matches a labelled "closing date" / "posted" style line in the detail body, used
 * to recover an absolute date when the page exposes one (best-effort only).
 */
export const OLEEO_DATE_LABEL_REGEX =
  /(?:closing\s*date|closes|posted|published|date\s*posted)\s*:?\s*([0-9]{1,2}[\s/-][A-Za-z0-9]{2,9}[\s/-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i;
