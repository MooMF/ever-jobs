/**
 * Constants for the Paychex Flex Hiring candidate-facing careers platform.
 *
 * Paychex (paychex.com, US payroll / HR vendor) ships an applicant-tracking and
 * recruiting product, "Paychex Flex Hiring", whose candidate-facing surface is a
 * hosted, public, unauthenticated careers site. Each customer (tenant) publishes
 * a branded "unique career site" on its own sub-domain of the Flex Hiring careers
 * host:
 *
 *   https://{tenant}.applybypaychex.com/
 *
 * Some tenants additionally front the same careers product under a Paychex Apply
 * host (e.g. `careers.paychex.com`, `apply.paychex.com`); when the caller supplies
 * such a host via `companyUrl` it is used verbatim.
 *
 * The careers index is a client-rendered application, so the listing page carries
 * no server-side job links. The stable, crawlable public surface is two-fold,
 * mirroring the sibling schema.org ATS adapters:
 *
 *  1. The tenant's XML sitemap, which enumerates every open role:
 *
 *       GET https://{tenant}.applybypaychex.com/sitemap.xml
 *         → <urlset> with one <url><loc>…/job/{jobId}/{slug}</loc>
 *             <lastmod>{ISO date}</lastmod> …</url> per open position.
 *
 *  2. Each role's server-rendered (pre-rendered for Google-for-Jobs) detail page,
 *     which embeds a schema.org `JobPosting` JSON-LD block:
 *
 *       GET https://{tenant}.applybypaychex.com/job/{jobId}/{slug}
 *         → HTML carrying
 *             <script type="application/ld+json">
 *               { "@type": "JobPosting",
 *                 "title": "…", "description": "<p>…HTML body…</p>",
 *                 "datePosted": "2026-05-20",
 *                 "employmentType": "FULL_TIME",
 *                 "hiringOrganization": { "name": "…" },
 *                 "jobLocation": { "address": {
 *                   "addressLocality": "Rochester", "addressRegion": "NY",
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
 *  - Confirmed the platform: Paychex Flex Hiring is a public-facing recruiting /
 *    ATS product that lets each customer "post jobs to their unique career site".
 *    The Paychex Apply careers host (`careers.paychex.com` / `apply.paychex.com`)
 *    is confirmed live and serves browsable, public job listings + per-job detail
 *    pages by department.
 *  - The per-tenant Flex Hiring careers site is a client-rendered app, so an
 *    unauthenticated HTML fetch returns only the app shell; the rendered JSON-LD
 *    payload's exact byte-level shape could NOT be confirmed via a no-JS fetch.
 *    The JSON-LD `JobPosting` surface is the documented Google-for-Jobs pattern a
 *    careers product advertises, so the parser is written defensively around it
 *    (verified=false).
 */

/** Canonical tenant careers-site host template (Flex Hiring sub-domain). */
export const PAYCHEX_HOST_TEMPLATE = 'https://{tenant}.applybypaychex.com';

/** Root careers domain — used to recognise tenant hosts passed via `companyUrl`. */
export const PAYCHEX_ROOT_DOMAIN = 'applybypaychex.com';

/**
 * Paychex Apply hosts some tenants front the Flex Hiring careers product under.
 * When a `companyUrl` resolves to one of these, its origin is used verbatim.
 */
export const PAYCHEX_ALT_DOMAINS = ['paychex.com'];

/** Public, unauthenticated XML sitemap that enumerates a tenant's open roles. */
export const PAYCHEX_SITEMAP_PATH = '/sitemap.xml';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const PAYCHEX_DEFAULT_RESULTS = 100;

/** Default request headers. The portal expects a browser-like UA. */
export const PAYCHEX_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Extracts each `<loc>…</loc>` value from the sitemap XML. */
export const PAYCHEX_SITEMAP_LOC_REGEX = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

/** Extracts a single `<lastmod>…</lastmod>` value from a sitemap `<url>` block. */
export const PAYCHEX_LASTMOD_REGEX = /<lastmod>\s*([^<\s]+)/i;

/**
 * Matches a tenant job-detail URL (in the sitemap's `<loc>` entries), capturing
 * the job id. Flex Hiring detail URLs are `…/job/{jobId}[/{slug}]` (or the
 * `/jobs/{jobId}` / `/careers/{jobId}` variant). The bare `/job/` index and other
 * site pages (about / privacy / departments) carry no id and are skipped.
 */
export const PAYCHEX_JOB_URL_REGEX = /\/(?:job|jobs|career|careers|position|positions|opening|openings)\/(\d+)(?:[/?#]|$)/i;

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner
 * JSON text from a detail page. A page may carry several JSON-LD blocks
 * (Organization, BreadcrumbList, JobPosting); we scan them all for the
 * `JobPosting` object.
 */
export const PAYCHEX_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts a `<meta property="og:…" content="…">` / `<meta name="…" content="…">` value. */
export const PAYCHEX_OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const PAYCHEX_OG_URL_REGEX = /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const PAYCHEX_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const PAYCHEX_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and body text. */
export const PAYCHEX_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
