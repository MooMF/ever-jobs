/**
 * Constants for the AkkenCloud applicant-tracking / staffing careers platform.
 *
 * AkkenCloud (akkencloud.com, US — Irving TX) is an enterprise, cloud-based
 * front-/middle-/back-office suite for staffing & recruiting agencies. Every
 * customer agency publishes a branded, public, unauthenticated job board served
 * by the same server-side ("AKKEN") web application. The canonical Akken-hosted
 * board lives on the shared host:
 *
 *   https://jobs.akkencloud.com/                    (shared / vendor board)
 *   https://{tenant}.akkencloud.com/                (per-agency Akken-hosted board)
 *
 * and many agencies additionally front the same board on their own custom
 * careers domain (rendered by the identical Akken app). The board's
 * listing/search page is the candidate-facing entry point, and each role has a
 * stable, **server-rendered** detail page addressed by its numeric job id:
 *
 *   GET https://{host}/                              (search / listing landing)
 *   GET https://{host}/jobdetails/{slug}/{location}/{jobId}
 *   GET https://{host}/jobdetails/{jobId}            (short id-only form)
 *     → HTML carrying the role's title, the agency/company name, a location line
 *       ("{City}, {State}"), an employment-type label, and the full job-ad body.
 *       Many Akken boards additionally emit a schema.org `JobPosting` JSON-LD
 *       block (`<script type="application/ld+json">`) and/or Open Graph
 *       (`og:title`, `og:description`, `og:url`) meta tags, which the adapter
 *       prefers when present and falls back to the visible HTML + `<title>`
 *       otherwise.
 *
 * Because the listing/search page is largely client-driven, the adapter
 * enumerates a tenant's open roles defensively: it first scans the tenant's
 * listing HTML (and any `/sitemap.xml`) for `/jobdetails/.../{jobId}` links, then
 * fetches and parses each detail page. The numeric job id is the stable per-role
 * ATS id. An unknown host (DNS failure / HTTP 4xx), a missing board, or a
 * malformed page degrades to an empty / partial (graceful) result rather than
 * throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication — DEFENSIVE):
 *  - The platform and the canonical board host `jobs.akkencloud.com`, together
 *    with the per-role detail URL shapes
 *    `https://jobs.akkencloud.com/jobdetails/{slug}/{location}/{jobId}` (e.g.
 *    `.../enterprise-account-executive-n-100-remote/nashua-new-hampshire/1110`,
 *    `.../systems-engineer-multiple-openings/nashua-new-hampshire/1103`) and the
 *    short `/jobdetails/{jobId}` form (e.g. `/jobdetails/389`) plus the
 *    `/submit_application` apply path, were observed via the public search index.
 *  - The live board host did **not** resolve from the research network (NXDOMAIN
 *    even via an authoritative-backed DoH resolver on 2026-06-03), so the exact
 *    HTML / JSON-LD wire shapes could **not** be byte-confirmed. This adapter is
 *    therefore a DEFENSIVE design (verified=false): it parses the documented
 *    server-rendered `/jobdetails/{...}/{id}` surface, prefers a schema.org
 *    `JobPosting` JSON-LD block, then Open Graph / visible HTML, and degrades
 *    gracefully on any fetch / DNS / HTTP / parse failure.
 */

/** Canonical, shared AkkenCloud-hosted job-board host (vendor + many agencies). */
export const AKKENCLOUD_SHARED_HOST = 'https://jobs.akkencloud.com';

/** Per-agency Akken-hosted board host template (`{tenant}` = the agency sub-domain label). */
export const AKKENCLOUD_HOST_TEMPLATE = 'https://{tenant}.akkencloud.com';

/** Root platform domain — used to recognise tenant hosts passed via `companyUrl`. */
export const AKKENCLOUD_ROOT_DOMAIN = 'akkencloud.com';

/**
 * Conventional sub-domain labels that name the *shared* board host rather than a
 * per-agency board (so e.g. `companySlug: "jobs"` resolves to the shared host).
 */
export const AKKENCLOUD_SHARED_LABELS = ['jobs', 'www', 'app', 'careers'];

/**
 * Listing / search landing path. We fetch it (and the host root) only to harvest
 * server-side `/jobdetails/.../{id}` links; the search UI is largely client-driven
 * and carries no structured job set of its own.
 */
export const AKKENCLOUD_LISTING_PATH = '/';

/** Public, unauthenticated XML sitemap path (tried as a secondary enumeration source). */
export const AKKENCLOUD_SITEMAP_PATH = '/sitemap.xml';

/** Per-role server-rendered detail-page path (short, id-only form). `{jobId}` is the ATS id. */
export const AKKENCLOUD_JOB_PATH_TEMPLATE = '/jobdetails/{jobId}';

/** Candidate apply path on the board (used as the apply URL fallback). */
export const AKKENCLOUD_APPLY_PATH = '/submit_application';

/**
 * Matches an AkkenCloud job-detail URL (absolute or root-relative), capturing the
 * **trailing numeric job id**. Covers both the slugged
 * `/jobdetails/{slug}/{location}/{id}` form and the short `/jobdetails/{id}` form.
 * Used to harvest open-role links from the listing / sitemap HTML.
 */
export const AKKENCLOUD_JOB_URL_REGEX =
  /(?:https?:\/\/[a-z0-9.-]+)?\/jobdetails\/(?:[^"'\s<>]*?\/)?(\d+)\b/gi;

/** Extracts each `<loc>…</loc>` value from a sitemap XML document. */
export const AKKENCLOUD_SITEMAP_LOC_REGEX = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

/**
 * Extracts a schema.org `JobPosting` JSON-LD block (the preferred structured
 * source when a board emits one). The captured group is the raw JSON object.
 */
export const AKKENCLOUD_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts an Open Graph / meta `content` value by property/name. `{key}` is substituted. */
export const AKKENCLOUD_META_REGEX_TEMPLATE =
  '<meta[^>]+(?:property|name)=["\']{key}["\'][^>]+content=["\']([\\s\\S]*?)["\']\\s*/?>';

/** Extracts the document `<title>` (fallback for the role title). */
export const AKKENCLOUD_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/**
 * Matches an `<h1>…</h1>` heading, used as a visible-HTML fallback for the role
 * title when no meta / JSON-LD title is present.
 */
export const AKKENCLOUD_H1_REGEX = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i;

/**
 * Captures a US "{City}, {ST}" (optional ZIP) location line from the visible HTML
 * body (e.g. "Nashua, NH" / "Nashua, New Hampshire 03060"). Used when neither
 * JSON-LD nor a structured location field is present.
 */
export const AKKENCLOUD_LOCATION_LINE_REGEX =
  /([A-Za-z][A-Za-z.'\- ]+?),\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?\b/;

/**
 * Captures an employment-type label from the visible HTML body (e.g.
 * "full-time", "part-time", "contract", "temporary", "contract-to-hire", …).
 * Staffing boards heavily use contract / temp / per-diem phrasings.
 */
export const AKKENCLOUD_EMPLOYMENT_TYPE_REGEX =
  /\b(full[\s-]?time|part[\s-]?time|contract(?:[\s-]?to[\s-]?hire)?|temp(?:orary)?(?:[\s-]?to[\s-]?(?:hire|perm))?|temp[\s-]?to[\s-]?perm|direct[\s-]?hire|seasonal|internship|intern|per[\s-]?diem|apprentice(?:ship)?)\b/i;

/** Detects remote / work-from-home roles across the common US phrasings. */
export const AKKENCLOUD_REMOTE_REGEX =
  /\b(remote|work\s*from\s*home|wfh|telecommute|telework)\b/i;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const AKKENCLOUD_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on enumeration source pages walked per scrape, so a pathological
 * board (or sitemap index chain) can never spin unbounded.
 */
export const AKKENCLOUD_MAX_PAGES = 50;

/** Default request headers. The board expects a browser-like UA. */
export const AKKENCLOUD_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
