/**
 * Constants for the ExactHire (HireCentric) applicant-tracking careers platform.
 *
 * ExactHire (exacthire.com, US SMB ATS) ships its applicant-tracking product
 * under the "HireCentric" brand, and every customer tenant publishes a branded,
 * public, unauthenticated job board on its own `hirecentric.com` sub-domain:
 *
 *   https://{tenant}.hirecentric.com/jobsearch/
 *
 * The listing page (`/jobsearch/`) renders one row per open role, each linking
 * to a server-rendered detail page. The stable, crawlable public surface is
 * two-fold:
 *
 *  1. The tenant's XML sitemap, which enumerates every open role:
 *
 *       GET https://{tenant}.hirecentric.com/sitemap.xml
 *         → <urlset> with one <url><loc>…/jobs/{jobId}.html</loc>
 *             <lastmod>{ISO date}</lastmod> …</url> per open position.
 *
 *  2. Each role's server-rendered detail page:
 *
 *       GET https://{tenant}.hirecentric.com/jobs/{jobId}.html
 *         → HTML carrying structured metadata. The page <title> follows the
 *           well-established cross-tenant pattern
 *             "{title} - {city}, {state} - {company} Jobs"
 *           e.g. "Senior Social Media Strategist - Washington, DC - AFL-CIO Jobs".
 *           Detail pages also expose `og:title` / `og:description` / `keywords`
 *           meta tags and, on schema.org-enabled tenants, a
 *           `<script type="application/ld+json">` JobPosting block carrying
 *           `title`, `datePosted`, `validThrough`, `employmentType`,
 *           `hiringOrganization.name` and `jobLocation.address` fields.
 *
 * The sitemap returns every open role for the tenant in one document (no
 * server-side pagination of the job set), so we slice client-side to honour
 * `resultsWanted`. The job id embedded in the detail-page URL
 * (`/jobs/{jobId}.html`, e.g. `230695`) is the stable per-role ATS id. An
 * unknown sub-domain (HTTP 404 / 4xx), a missing sitemap, or a malformed detail
 * page degrades to an empty / partial (graceful) result rather than throwing, so
 * a single bad tenant never breaks a batch run.
 *
 * Surface confirmed 2026-06-03 via the public Google index (the tenant
 * `*.hirecentric.com` sub-domains were not directly reachable from the build
 * environment's DNS resolver, so a live unauthenticated 200 could not be
 * captured here — hence the parser is written defensively and the e2e tests
 * tolerate empty results):
 *  - `https://aflcio.hirecentric.com/jobsearch/` — AFL-CIO public board.
 *  - `https://aflcio.hirecentric.com/jobs/230695.html` — indexed as
 *    "Senior Social Media Strategist - Washington, DC - AFL-CIO Jobs".
 *  - Sibling tenants confirmed on the same `{tenant}.hirecentric.com/jobs/{id}.html`
 *    pattern: `myus` (MyUS.com), `coadvantage`, `phihelico` (PHI, Inc.), `ambu`,
 *    `spokaneproduce`, `employindy`, `cumminsbhs`, `apexbg`.
 */

/** Canonical tenant job-board host template. */
export const EXACTHIRE_HOST_TEMPLATE = 'https://{tenant}.hirecentric.com';

/** Root career domain — used to recognise tenant hosts passed via `companyUrl`. */
export const EXACTHIRE_ROOT_DOMAIN = 'hirecentric.com';

/** Public, unauthenticated XML sitemap that enumerates a tenant's open roles. */
export const EXACTHIRE_SITEMAP_PATH = '/sitemap.xml';

/** Per-role server-rendered detail-page path. `{jobId}` is the ATS id. */
export const EXACTHIRE_JOB_PATH_TEMPLATE = '/jobs/{jobId}.html';

/**
 * Matches a tenant job-detail URL inside the sitemap's `<loc>` entries,
 * capturing the role id. The id may be plain (`230695`) or compound
 * (`232783-35332`); only `/jobs/{id}.html` entries are roles — the bare
 * `/jobsearch/` listing and `/account/` links are skipped.
 */
export const EXACTHIRE_JOB_URL_REGEX = /https?:\/\/[a-z0-9-]+\.hirecentric\.com\/jobs\/([0-9][0-9-]*)\.html/gi;

/** Captures the role id from a `/jobs/{id}.html` path (plain or compound). */
export const EXACTHIRE_JOB_ID_REGEX = /\/jobs\/([0-9][0-9-]*)\.html/i;

/** Extracts each `<loc>…</loc>` value from the sitemap XML. */
export const EXACTHIRE_SITEMAP_LOC_REGEX = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

/** Extracts a single `<lastmod>…</lastmod>` value from a sitemap `<url>` block. */
export const EXACTHIRE_LASTMOD_REGEX = /<lastmod>\s*([^<\s]+)/i;

/**
 * Extracts a `<script type="application/ld+json">…</script>` block's inner JSON.
 * schema.org-enabled tenants emit a JobPosting object here; we parse it when
 * present and fall back to the `<title>` / `og:` meta tags otherwise.
 */
export const EXACTHIRE_JSON_LD_REGEX = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts a `<meta property="og:…" content="…">` / `<meta name="…" content="…">` value. */
export const EXACTHIRE_OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const EXACTHIRE_OG_URL_REGEX = /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const EXACTHIRE_OG_DESCRIPTION_REGEX = /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const EXACTHIRE_KEYWORDS_REGEX = /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i;
export const EXACTHIRE_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Detects remote / work-from-home roles across common US phrasings. */
export const EXACTHIRE_REMOTE_REGEX = /\b(remote|work\s*from\s*home|telecommute|wfh|home[\s-]?based)\b/i;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const EXACTHIRE_DEFAULT_RESULTS = 100;

/** Default request headers. The board expects a browser-like UA. */
export const EXACTHIRE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
