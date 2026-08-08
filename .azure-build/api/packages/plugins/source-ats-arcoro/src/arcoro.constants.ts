/**
 * Constants for the Arcoro (formerly BirdDogHR) applicant-tracking careers
 * platform.
 *
 * Arcoro (arcoro.com — its ATS/job-board engine was historically branded
 * "BirdDogHR") is a US construction / skilled-trades / blue-collar HR suite.
 * Every customer tenant publishes a branded, public, unauthenticated job board
 * on its own sub-domain of `birddoghr.com`, all served by the same server-side
 * ASP.NET MVC application:
 *
 *   https://{tenant}.birddoghr.com/                 (tenant career center)
 *   https://jobs.ourcareerpages.com/                (shared career-pages host)
 *
 * The board's listing/search page (`/JobSearchAdvanced`) is rendered
 * client-side (its rows are fetched at run time), so it carries no reliable
 * server-side job links. The stable, crawlable public surface is the per-role,
 * **server-rendered detail page**, addressed by the numeric job id:
 *
 *   GET https://{host}/job/{jobId}
 *     → HTML carrying the role's title, the tenant/company name, a
 *       "{City}, {State} {Zip}" location line, the employment type, and the
 *       full job-ad body. Some tenants additionally emit a schema.org
 *       `JobPosting` JSON-LD block (`<script type="application/ld+json">`) and/or
 *       Open Graph (`og:title`, `og:description`, `og:url`) meta tags, which the
 *       adapter prefers when present and falls back to the visible HTML +
 *       `<title>` otherwise.
 *
 * Because the listing is client-rendered, the adapter enumerates a tenant's
 * open roles defensively: it first scans the tenant's listing/search HTML (and
 * any `/sitemap.xml`) for `/job/{jobId}` links, then fetches and parses each
 * detail page. The job id is the stable per-role ATS id. An unknown sub-domain
 * (HTTP 404 / other 4xx), a missing board, or a malformed page degrades to an
 * empty / partial (graceful) result rather than throwing, so a single bad
 * tenant never breaks a batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `https://jobs.ourcareerpages.com/job/77551` → HTTP 200, server-rendered
 *    HTML for "Mid-Market Software Sales Representative" (company "BirdDogHR",
 *    location "Atlanta, GA 30313", "full-time, exempt").
 *  - `https://jobs.ourcareerpages.com/job/62256` → HTTP 200, server-rendered
 *    HTML for "Implementation & Support Specialist" (company "BirdDogHR",
 *    location "Urbandale, IA 50322").
 *  - Tenant career centers confirmed on the `{tenant}.birddoghr.com` host
 *    pattern (same MVC app, same `/JobSearchAdvanced` + `/job/{id}` routes):
 *    `jobs`, `engineeringjobs`, `procoreconstructionjobboard`, `agciajobs`,
 *    `agcksjobs`.
 *  - The official Arcoro/BirdDogHR REST APIs are partner/OAuth gated and
 *    therefore unsuitable for a generic, tenant-agnostic, unauthenticated
 *    scraper; the public `/job/{id}` detail page is the documented no-auth
 *    surface used here.
 */

/** Canonical tenant career-center host template (Arcoro / BirdDogHR engine). */
export const ARCORO_HOST_TEMPLATE = 'https://{tenant}.birddoghr.com';

/** Shared career-pages host used by tenants without a vanity `birddoghr.com` sub-domain. */
export const ARCORO_SHARED_HOST = 'https://jobs.ourcareerpages.com';

/** Root career domain — used to recognise tenant hosts passed via `companyUrl`. */
export const ARCORO_ROOT_DOMAIN = 'birddoghr.com';

/** Secondary career-pages domain (shared host), also recognised on `companyUrl`. */
export const ARCORO_CAREERPAGES_DOMAIN = 'ourcareerpages.com';

/**
 * Client-rendered listing/search page path. We fetch it only to harvest
 * server-side `/job/{id}` links (and any apply links); it carries no structured
 * job set of its own.
 */
export const ARCORO_LISTING_PATH = '/JobSearchAdvanced';

/** Public, unauthenticated XML sitemap path (tried as a secondary enumeration source). */
export const ARCORO_SITEMAP_PATH = '/sitemap.xml';

/** Per-role server-rendered detail-page path. `{jobId}` is the ATS id. */
export const ARCORO_JOB_PATH_TEMPLATE = '/job/{jobId}';

/**
 * Matches a tenant job-detail URL (absolute or root-relative), capturing the
 * numeric job id. Used to harvest open-role links from the listing/sitemap HTML.
 */
export const ARCORO_JOB_URL_REGEX = /(?:https?:\/\/[a-z0-9.-]+)?\/job\/(\d+)\b/gi;

/** Extracts each `<loc>…</loc>` value from a sitemap XML document. */
export const ARCORO_SITEMAP_LOC_REGEX = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

/**
 * Extracts a schema.org `JobPosting` JSON-LD block (the preferred structured
 * source when a tenant emits one). The captured group is the raw JSON object.
 */
export const ARCORO_JSONLD_REGEX = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts an Open Graph / meta `content` value by property/name. `{key}` is substituted. */
export const ARCORO_META_REGEX_TEMPLATE =
  '<meta[^>]+(?:property|name)=["\']{key}["\'][^>]+content=["\']([\\s\\S]*?)["\']\\s*/?>';

/** Extracts the document `<title>` (fallback for the role title). */
export const ARCORO_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/**
 * Matches an `<h1>…</h1>` heading, used as a visible-HTML fallback for the role
 * title when no meta / JSON-LD title is present.
 */
export const ARCORO_H1_REGEX = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i;

/**
 * Captures a US "{City}, {ST} {ZIP}" location line from the visible HTML body
 * (e.g. "Atlanta, GA 30313"). `ZIP` is optional. Used when neither JSON-LD nor
 * a structured location field is present.
 */
export const ARCORO_LOCATION_LINE_REGEX = /([A-Za-z][A-Za-z.'\- ]+?),\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?\b/;

/**
 * Captures an employment-type label from the visible HTML body (e.g.
 * "full-time", "part-time", "contract", "temporary", "internship", "seasonal").
 */
export const ARCORO_EMPLOYMENT_TYPE_REGEX =
  /\b(full[\s-]?time|part[\s-]?time|contract|temporary|temp|seasonal|internship|intern|per[\s-]?diem|apprentice(?:ship)?)\b/i;

/** Detects remote / work-from-home roles across the common US phrasings. */
export const ARCORO_REMOTE_REGEX = /\b(remote|work\s*from\s*home|wfh|telecommute|telework)\b/i;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const ARCORO_DEFAULT_RESULTS = 100;

/** Default request headers. The board expects a browser-like UA. */
export const ARCORO_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
