/**
 * Constants for the Namely HR / recruiting careers platform.
 *
 * Namely (namely.com, US — an all-in-one HR, payroll, benefits & recruiting
 * platform) gives every customer tenant a branded, public, unauthenticated
 * candidate-facing career site on its own sub-domain of `namely.com`:
 *
 *   https://{tenant}.namely.com/careersite
 *
 * The tenant is addressed by that first sub-domain label (e.g. `acme` →
 * `acme.namely.com`); when a caller instead supplies a full career-site URL via
 * `companyUrl`, its origin is used verbatim.
 *
 * The career site's jobs index is a client-rendered single-page app, so the
 * listing page carries no server-side job links. The stable, crawlable public
 * surface is two-fold, mirroring the sibling schema.org ATS adapters:
 *
 *  1. The tenant's XML sitemap, which enumerates every open role:
 *
 *       GET https://{tenant}.namely.com/sitemap.xml
 *         → <urlset> with one <url><loc>…/careersite/job/{jobId}/{slug}</loc>
 *             <lastmod>{ISO date}</lastmod> …</url> per open position.
 *
 *  2. Each role's server-rendered (pre-rendered for Google-for-Jobs) detail page,
 *     which embeds a schema.org `JobPosting` JSON-LD block:
 *
 *       GET https://{tenant}.namely.com/careersite/job/{jobId}/{slug}
 *         → HTML carrying
 *             <script type="application/ld+json">
 *               { "@type": "JobPosting",
 *                 "title": "…", "description": "<p>…HTML body…</p>",
 *                 "datePosted": "2026-05-20",
 *                 "employmentType": "FULL_TIME",
 *                 "hiringOrganization": { "name": "…" },
 *                 "jobLocation": { "address": {
 *                   "addressLocality": "New York", "addressRegion": "NY",
 *                   "addressCountry": "US" } },
 *                 "identifier": { "value": "{jobId}" },
 *                 "jobLocationType": "TELECOMMUTE" (present when remote) }
 *             </script>
 *           plus the usual `og:title` / `og:url` / `og:description` meta fallbacks.
 *
 * The sitemap returns every open role for the tenant in one document (no
 * server-side pagination of the job set), so we slice client-side to honour
 * `resultsWanted`. An unknown sub-domain (HTTP 404 / 4xx), a missing sitemap, a
 * malformed detail page, or a non-JSON JSON-LD block degrades to an empty
 * (graceful) result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication):
 *  - Confirmed the platform and the tenant host pattern `{tenant}.namely.com`
 *    (Namely addresses every company by its own sub-domain of `namely.com`) and
 *    that each tenant publishes a public candidate-facing career site under it.
 *  - Namely's documented JSON job/recruiting API (developers.namely.com) is
 *    OAuth-gated and therefore out of scope; only the anonymous candidate-facing
 *    career site is consumed.
 *  - The career sites are JS-rendered SPAs, so an unauthenticated HTML fetch
 *    returns only the app shell; the rendered JSON-LD payload's exact byte-level
 *    shape could NOT be confirmed via a no-JS fetch. The JSON-LD `JobPosting`
 *    surface is the documented Google-for-Jobs pattern career sites advertise, so
 *    the parser is written defensively around it (verified=false).
 */

/** Canonical tenant career-site host template (Namely sub-domain). */
export const NAMELY_HOST_TEMPLATE = 'https://{tenant}.namely.com';

/** Root platform domain — used to recognise tenant hosts passed via `companyUrl`. */
export const NAMELY_ROOT_DOMAIN = 'namely.com';

/** Public, unauthenticated XML sitemap that enumerates a tenant's open roles. */
export const NAMELY_SITEMAP_PATH = '/sitemap.xml';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const NAMELY_DEFAULT_RESULTS = 100;

/** Default request headers. The career site expects a browser-like UA. */
export const NAMELY_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Extracts each `<loc>…</loc>` value from the sitemap XML. */
export const NAMELY_SITEMAP_LOC_REGEX = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

/** Extracts a single `<lastmod>…</lastmod>` value from a sitemap `<url>` block. */
export const NAMELY_LASTMOD_REGEX = /<lastmod>\s*([^<\s]+)/i;

/**
 * Matches a tenant job-detail URL (in the sitemap's `<loc>` entries), capturing
 * the job id. Namely career-site detail URLs are
 * `…/careersite/job/{jobId}[/{slug}]` (or the bare `/job/{jobId}` variant). The
 * bare `/careersite` index and other site pages (about / departments) carry no id
 * and are skipped.
 */
export const NAMELY_JOB_URL_REGEX = /\/(?:careersite\/)?(?:job|jobs|posting|postings)\/(\d+)(?:[/?#]|$)/i;

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner
 * JSON text from a detail page. A page may carry several JSON-LD blocks
 * (Organization, BreadcrumbList, JobPosting); we scan them all for the
 * `JobPosting` object.
 */
export const NAMELY_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts a `<meta property="og:…" content="…">` / `<meta name="…" content="…">` value. */
export const NAMELY_OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const NAMELY_OG_URL_REGEX = /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const NAMELY_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const NAMELY_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and body text. */
export const NAMELY_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
