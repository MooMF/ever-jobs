/**
 * Constants for the ApplicantPro applicant-tracking careers platform.
 *
 * ApplicantPro (applicantpro.com) is a US small/medium-business ATS. Every
 * customer tenant publishes a branded, public, unauthenticated job board on its
 * own sub-domain:
 *
 *   https://{tenant}.applicantpro.com/jobs/
 *
 * The board's listing page is rendered client-side (a Vue web component that
 * fetches its rows from an internal, run-time-computed API), so it carries no
 * server-side job links. The stable, crawlable public surface is two-fold:
 *
 *  1. The tenant's XML sitemap, which enumerates every open role:
 *
 *       GET https://{tenant}.applicantpro.com/sitemap.xml
 *         → <urlset> with one <url><loc>…/jobs/{jobId}.html</loc>
 *             <lastmod>{ISO date}</lastmod> …</url> per open position.
 *
 *  2. Each role's server-rendered detail page:
 *
 *       GET https://{tenant}.applicantpro.com/jobs/{jobId}.html
 *         → HTML carrying structured metadata:
 *             <title>{title} - {city}, {state} - {company} Jobs</title>
 *             <meta property="og:title"   content="{title} - {city}, {state}">
 *             <meta property="og:url"      content="https://www.applicantpro.com/openings/{tenant}/jobs/{jobId}/…">
 *             <meta property="og:description" content="Company: {company}…{body}">
 *             <meta name="keywords"        content="{title}, {city}, {state}, {country}, {department}">
 *           plus an inline `JobDetail` mount object:
 *             { domainTitle: "{company}", jobListingId: {jobId},
 *               jobInfo: { mdiCalendar: "Posted {DD-Mon-YYYY} ({TZ})",
 *                          mdiMapMarker: "{city}, {state}, {country}",
 *                          mdiInbox: "{employment type}" } }
 *
 * The sitemap returns every open role for the tenant in one document (no
 * server-side pagination of the job set), so we slice client-side to honour
 * `resultsWanted`. An unknown sub-domain (HTTP 404 / 4xx), a missing sitemap, or
 * a malformed detail page degrades to an empty (graceful) result rather than
 * throwing, so a single bad tenant never breaks a batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `https://pharrtx.applicantpro.com/sitemap.xml` → HTTP 200 `text/xml`,
 *    `<urlset>` enumerating `…/jobs/{id}.html` open-role URLs (City of Pharr, TX).
 *  - `https://communitybridge.applicantpro.com/jobs/995117.html` → HTTP 200 HTML
 *    with `og:title`/`og:url`/`og:description`, `meta[keywords]`, and the inline
 *    `JobDetail` mount object (`domainTitle: "Community Bridge"`,
 *    `jobInfo.mdiCalendar: "Posted 06-Feb-2019 (EST)"`,
 *    `jobInfo.mdiMapMarker: "Washington, DC, USA"`, `jobInfo.mdiInbox: "Full Time"`).
 *  - Tenant boards with no open roles still serve a valid sitemap whose only
 *    `/jobs/` entry is the board index (no `/jobs/{id}.html` rows) → empty result.
 */

/** Canonical tenant job-board host template. */
export const APPLICANTPRO_HOST_TEMPLATE = 'https://{tenant}.applicantpro.com';

/** Public, unauthenticated XML sitemap that enumerates a tenant's open roles. */
export const APPLICANTPRO_SITEMAP_PATH = '/sitemap.xml';

/** Per-role server-rendered detail-page path. `{jobId}` is the ATS id. */
export const APPLICANTPRO_JOB_PATH_TEMPLATE = '/jobs/{jobId}.html';

/**
 * Matches a tenant job-detail URL inside the sitemap's `<loc>` entries,
 * capturing the numeric job id. Only `/jobs/{digits}.html` entries are roles;
 * the bare `/jobs/` index and `/jobsandemployment/…` facet links are skipped.
 */
export const APPLICANTPRO_JOB_URL_REGEX = /https?:\/\/[a-z0-9-]+\.applicantpro\.com\/jobs\/(\d+)\.html/gi;

/** Extracts each `<loc>…</loc>` value from the sitemap XML. */
export const APPLICANTPRO_SITEMAP_LOC_REGEX = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

/** Extracts a single `<lastmod>…</lastmod>` value from a sitemap `<url>` block. */
export const APPLICANTPRO_LASTMOD_REGEX = /<lastmod>\s*([^<\s]+)/i;

/** Extracts the inline `JobDetail` mount object's `jobInfo` JSON blob. */
export const APPLICANTPRO_JOB_INFO_REGEX = /jobInfo\s*:\s*(\{[^}]*\})/i;

/** Extracts the inline `JobDetail` mount object's `domainTitle` (company name). */
export const APPLICANTPRO_DOMAIN_TITLE_REGEX = /domainTitle\s*:\s*"((?:[^"\\]|\\.)*)"/i;

/** Extracts a `<meta property="og:…" content="…">` / `<meta name="…" content="…">` value. */
export const APPLICANTPRO_OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const APPLICANTPRO_OG_URL_REGEX = /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const APPLICANTPRO_OG_DESCRIPTION_REGEX = /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const APPLICANTPRO_KEYWORDS_REGEX = /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i;
export const APPLICANTPRO_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/**
 * Parses the `jobInfo.mdiCalendar` string, e.g. "Posted 06-Feb-2019 (EST)" →
 * captures the `DD-Mon-YYYY` date.
 */
export const APPLICANTPRO_POSTED_DATE_REGEX = /Posted\s+(\d{1,2}-[A-Za-z]{3}-\d{4})/i;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const APPLICANTPRO_DEFAULT_RESULTS = 100;

/** Default request headers. The board expects a browser-like UA. */
export const APPLICANTPRO_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
