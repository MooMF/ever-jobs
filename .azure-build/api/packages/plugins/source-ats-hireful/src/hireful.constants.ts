/**
 * Constants for the Hireful applicant-tracking / recruitment careers platform.
 *
 * Hireful (hireful.com / hireful.co.uk, UK) is a UK ATS & recruitment-software
 * vendor whose candidate-facing product is the "LiveVacancies" careers portal.
 * Every customer tenant publishes a branded, public, unauthenticated career site
 * on its own sub-domain of `livevacancies.co.uk`:
 *
 *   https://{tenant}.livevacancies.co.uk/
 *
 * Some tenants additionally front the same portal under a custom careers host
 * (e.g. `agency.hireful.com`, `www.hirefulcareers.co.uk`); when the caller
 * supplies such a host via `companyUrl` it is used verbatim.
 *
 * The portal's jobs index is a client-rendered single-page app (a hashbang
 * `#!/`-routed LiveVacancies app), so the listing page carries no server-side
 * job links. The stable, crawlable public surface is two-fold, mirroring the
 * sibling schema.org ATS adapters:
 *
 *  1. The tenant's XML sitemap, which enumerates every open role:
 *
 *       GET https://{tenant}.livevacancies.co.uk/sitemap.xml
 *         → <urlset> with one <url><loc>…/vacancy/{vacancyId}/{slug}</loc>
 *             <lastmod>{ISO date}</lastmod> …</url> per open position.
 *
 *  2. Each role's server-rendered (pre-rendered for Google-for-Jobs) detail page,
 *     which embeds a schema.org `JobPosting` JSON-LD block:
 *
 *       GET https://{tenant}.livevacancies.co.uk/vacancy/{vacancyId}/{slug}
 *         → HTML carrying
 *             <script type="application/ld+json">
 *               { "@type": "JobPosting",
 *                 "title": "…", "description": "<p>…HTML body…</p>",
 *                 "datePosted": "2026-05-20",
 *                 "employmentType": "FULL_TIME",
 *                 "hiringOrganization": { "name": "…" },
 *                 "jobLocation": { "address": {
 *                   "addressLocality": "Birmingham", "addressRegion": "West Midlands",
 *                   "addressCountry": "GB" } },
 *                 "identifier": { "value": "{vacancyId}" },
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
 *  - Confirmed the platform + tenant host pattern `{tenant}.livevacancies.co.uk`
 *    and real, named tenants on it: `thebigissue` (The Big Issue), `tkat` (TKAT),
 *    `hirefulagency` (hireful Agency), `planinternationaluk` (Plan International
 *    UK), `glide`, `transforminglearning`. Custom careers hosts confirmed:
 *    `agency.hireful.com`, `www.hirefulcareers.co.uk`.
 *  - The portals are JS-rendered SPAs, so an unauthenticated HTML fetch returns
 *    only the app shell; the rendered JSON-LD payload's exact byte-level shape
 *    could NOT be confirmed via a no-JS fetch. The JSON-LD `JobPosting` surface
 *    is the documented Google-for-Jobs pattern Hireful's careers product
 *    advertises, so the parser is written defensively around it (verified=false).
 */

/** Canonical tenant careers-portal host template (LiveVacancies sub-domain). */
export const HIREFUL_HOST_TEMPLATE = 'https://{tenant}.livevacancies.co.uk';

/** Root portal domain — used to recognise tenant hosts passed via `companyUrl`. */
export const HIREFUL_ROOT_DOMAIN = 'livevacancies.co.uk';

/**
 * Custom careers hosts some tenants front the LiveVacancies portal under. When a
 * `companyUrl` resolves to one of these, its origin is used verbatim.
 */
export const HIREFUL_ALT_DOMAINS = ['hireful.com', 'hirefulcareers.co.uk'];

/** Public, unauthenticated XML sitemap that enumerates a tenant's open roles. */
export const HIREFUL_SITEMAP_PATH = '/sitemap.xml';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const HIREFUL_DEFAULT_RESULTS = 100;

/** Default request headers. The portal expects a browser-like UA. */
export const HIREFUL_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/** Extracts each `<loc>…</loc>` value from the sitemap XML. */
export const HIREFUL_SITEMAP_LOC_REGEX = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

/** Extracts a single `<lastmod>…</lastmod>` value from a sitemap `<url>` block. */
export const HIREFUL_LASTMOD_REGEX = /<lastmod>\s*([^<\s]+)/i;

/**
 * Matches a tenant vacancy-detail URL (in the sitemap's `<loc>` entries),
 * capturing the vacancy id. LiveVacancies detail URLs are
 * `…/vacancy/{vacancyId}[/{slug}]` (or the hashbang `#!/vacancy/{vacancyId}`
 * variant flattened to a path). The bare `/vacancy/` index and other site pages
 * (about / preferences / departments) carry no id and are skipped.
 */
export const HIREFUL_VACANCY_URL_REGEX = /\/(?:vacancy|vacancies|job|jobs)\/(\d+)(?:[/?#]|$)/i;

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner
 * JSON text from a detail page. A page may carry several JSON-LD blocks
 * (Organization, BreadcrumbList, JobPosting); we scan them all for the
 * `JobPosting` object.
 */
export const HIREFUL_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts a `<meta property="og:…" content="…">` / `<meta name="…" content="…">` value. */
export const HIREFUL_OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const HIREFUL_OG_URL_REGEX = /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const HIREFUL_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const HIREFUL_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and body text. */
export const HIREFUL_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
