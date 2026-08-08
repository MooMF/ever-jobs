/**
 * Constants for the Mindscope (Univerus Workforce) staffing / recruiting ATS-CRM
 * careers platform.
 *
 * Mindscope (mindscope.com, US / CA — now part of Univerus Workforce) is a
 * staffing & recruiting ATS/CRM. Its candidate-facing product is a branded,
 * public "Candidate Portal" / job board. Every customer tenant publishes a
 * public, unauthenticated career portal on a path segment of one of the shared
 * portal hosts, keyed by the tenant's portal code (an opaque alphanumeric token,
 * e.g. `WHITEC04415`):
 *
 *   https://portal{N}.mindscope.com/{TENANTCODE}_V2Portal/
 *
 * (e.g. `https://portal2.mindscope.com/WHITEC04415_V2Portal/`). The portal is a
 * server-rendered ASP.NET WebForms application (the "V2Portal"), not a
 * client-rendered SPA, so its pages are crawlable without JavaScript. The stable,
 * crawlable public surface is two-fold:
 *
 *  1. The tenant's public jobs / job-board page, which lists every open posting
 *     with a link to its candidate-facing detail page:
 *
 *       GET https://portal{N}.mindscope.com/{TENANTCODE}_V2Portal/Modules/Candidate/JobBoard.aspx
 *         → server-rendered HTML in which each open posting links to its detail
 *           page via a query string carrying the posting id:
 *             <a href="…JobDetails.aspx?JobId={jobId}">{title}</a>
 *
 *  2. Each posting's server-rendered detail page, which carries the full ad body
 *     plus title / location / employment-type metadata, and — because Mindscope
 *     markets "SEO-enhanced job listings compatible with Google for Jobs" — a
 *     schema.org `JobPosting` JSON-LD block (with `og:` meta tags and the
 *     `<title>` / body HTML as defensive fallbacks):
 *
 *       GET https://portal{N}.mindscope.com/{TENANTCODE}_V2Portal/Modules/Candidate/JobDetails.aspx?JobId={jobId}
 *         → HTML detail page optionally embedding
 *             <script type="application/ld+json">{ "@type": "JobPosting", … }</script>
 *           and `<meta property="og:title|og:description|og:url" …>`.
 *
 * The job-board page lists every open posting for the tenant in one document
 * (the public board paginates client-side; the first response enumerates the
 * postings), so we read the board once, collect its `JobDetails.aspx?JobId={id}`
 * links, and slice client-side to honour `resultsWanted`, then enrich the wanted
 * postings from their detail pages, bounded by a hard page cap. An unknown tenant
 * (HTTP 404 / 4xx), a missing board, a malformed detail page, a non-JSON JSON-LD
 * block, or a single bad posting degrades to an empty (graceful) / partial result
 * rather than throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication — DEFENSIVE,
 * verified=false):
 *  - Confirmed the platform + tenant portal pattern
 *    `portal{N}.mindscope.com/{TENANTCODE}_V2Portal/Modules/Candidate/…` and a
 *    real, named tenant portal on it: `WHITEC04415` on `portal2.mindscope.com`
 *    (a public `WHITEC04415_V2Portal/Modules/Candidate/CandidateLogin.aspx`
 *    candidate portal). The portal is a server-rendered ASP.NET WebForms app.
 *  - The exact public job-board / job-detail page names and any query-parameter
 *    keys could NOT be confirmed live without authentication (the candidate
 *    portal fronts an auth gateway, and no public JSON API was discoverable), so
 *    the page paths (`JobBoard.aspx`, `JobDetails.aspx?JobId={id}`) and the
 *    JSON-LD-first parse follow Mindscope's documented public portal / Google for
 *    Jobs surface and the sibling server-HTML ATS adapters. Field extraction is
 *    written defensively around the stable structural markers (the
 *    `JobDetails.aspx?JobId={id}` link, the JSON-LD `JobPosting`, the `og:` meta
 *    tags, and the `<title>` / body HTML), so cross-tenant markup drift degrades
 *    gracefully rather than throwing.
 */

/** Default public portal host (every tenant lives on a path of a `portal{N}` host). */
export const MINDSCOPE_PORTAL_ORIGIN = 'https://portal2.mindscope.com';

/** Root portal domain — used to recognise portal hosts passed via `companyUrl`. */
export const MINDSCOPE_ROOT_DOMAIN = 'mindscope.com';

/** Suffix appended to a tenant code to form its V2Portal path segment. */
export const MINDSCOPE_PORTAL_SUFFIX = '_V2Portal';

/** Candidate-module path under a tenant's V2Portal segment. */
export const MINDSCOPE_CANDIDATE_PATH = '/Modules/Candidate';

/** Public, unauthenticated job-board / listing page (per tenant portal). */
export const MINDSCOPE_JOBBOARD_PAGE = 'JobBoard.aspx';

/** Per-posting detail page (keyed by `?JobId={id}`). */
export const MINDSCOPE_JOBDETAILS_PAGE = 'JobDetails.aspx';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open postings.
 */
export const MINDSCOPE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on detail pages fetched per scrape, so a pathologically large
 * tenant board (or a very high `resultsWanted`) can never spin unbounded.
 */
export const MINDSCOPE_MAX_PAGES = 250;

/** Default request headers. The portal expects a browser-like UA. */
export const MINDSCOPE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches a posting's detail link (absolute or relative) on the job-board page,
 * capturing the posting id from `JobDetails.aspx?JobId={id}`. The id is the
 * Mindscope posting id (used as the ATS id). Case-insensitive / global so every
 * posting on the page is enumerated. The query string may carry the JobId as the
 * first or a later parameter, and the id is alphanumeric (numeric in practice).
 */
export const MINDSCOPE_DETAIL_LINK_REGEX =
  /href=["']([^"']*JobDetails\.aspx\?[^"']*\bJobId=([A-Za-z0-9_-]+)[^"']*)["']/gi;

/**
 * Recovers a posting id from any Mindscope detail URL (`…JobDetails.aspx?JobId={id}`).
 * Used when resolving a single-posting `companyUrl`.
 */
export const MINDSCOPE_JOB_ID_REGEX = /[?&]JobId=([A-Za-z0-9_-]+)/i;

/**
 * Matches a tenant portal segment (`{TENANTCODE}_V2Portal`) anywhere in a portal
 * URL path, capturing the tenant code. Used to resolve a tenant from a
 * `companyUrl` and to recover the base portal segment for building detail URLs.
 */
export const MINDSCOPE_PORTAL_SEGMENT_REGEX = /\/([A-Za-z0-9._-]+)_V2Portal(?:\/|$)/i;

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner
 * JSON text from a detail page, so we can scan them all for a `JobPosting` object.
 */
export const MINDSCOPE_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts `<meta property="og:…" content="…">` / `<title>…</title>` values. */
export const MINDSCOPE_OG_TITLE_REGEX =
  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const MINDSCOPE_OG_URL_REGEX =
  /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const MINDSCOPE_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const MINDSCOPE_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and body text. */
export const MINDSCOPE_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
