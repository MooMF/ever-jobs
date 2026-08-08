/**
 * Constants for the Jobtrain applicant-tracking careers platform.
 *
 * Jobtrain (jobtrain.co.uk, UK) is an established UK ATS used by NHS boards,
 * local government, housing associations and charities. Every customer tenant
 * publishes a branded, public, unauthenticated career site under a tenant path
 * on the shared career host:
 *
 *   https://www.jobtrain.co.uk/{tenant}/Home/Job
 *
 * That listing page is rendered client-side (a jQuery widget that requests its
 * job cards from an internal partial), so the page HTML itself carries no
 * server-side job links. The stable, crawlable public surface is two-fold:
 *
 *  1. The tenant's live-vacancy card partial, which enumerates every open role:
 *
 *       GET https://www.jobtrain.co.uk/{tenant}/Home/_JobCard
 *         → an HTML fragment with one card per open position, each carrying a
 *           `data-jobId="{jobId}"` attribute and an
 *           `href="/{tenant}/Job/JobDetail?JobId={jobId}"` detail link.
 *
 *  2. Each role's server-rendered detail page, which embeds a complete
 *     schema.org `JobPosting` JSON-LD block:
 *
 *       GET https://www.jobtrain.co.uk/{tenant}/Job/JobDetail?JobId={jobId}
 *         → HTML carrying
 *             <script type="application/ld+json">
 *               { "@type": "JobPosting",
 *                 "title": "{title}",
 *                 "datePosted": "{YYYY-MM-DD}",
 *                 "validThrough": "{ISO}",
 *                 "baseSalary": "{salary text}",
 *                 "employmentType": "{type}",
 *                 "description": "{HTML body}",
 *                 "jobLocation": { "@type": "Place",
 *                   "address": { "@type": "PostalAddress",
 *                     "addressLocality": "{city}", "addressRegion": "{region}",
 *                     "postalCode": "{postcode}", "addressCountry": "{country}" } },
 *                 "hiringOrganization": { "@type": "Organization", "name": "{company}" },
 *                 "url": "https://www.jobtrain.co.uk/{tenant}/Job/JobDetail?JobId={jobId}&Source=…" }
 *             </script>
 *
 * The `_JobCard` partial returns every live vacancy for the tenant in one
 * response (no server-side pagination of the job set), so we enumerate once and
 * slice client-side to honour `resultsWanted`, fetching only as many detail
 * pages as the caller asked for. An unknown tenant (HTTP 404 / 4xx), a missing
 * partial, or a malformed detail page degrades to an empty / partial (graceful)
 * result rather than throwing, so a single bad tenant never breaks a batch run.
 *
 * NOTE on the official feed: Jobtrain can enable a per-tenant automated XML feed
 * of live vacancies for partner job boards (e.g. the LinkedIn job feed), but
 * that feed is provisioned per integration at an opaque, non-discoverable URL
 * and is therefore unsuitable for a generic, tenant-agnostic scraper. The public
 * career-site card partial + schema.org detail pages are the documented, no-auth
 * surface used here.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `GET https://www.jobtrain.co.uk/crossreach/Home/_JobCard` → HTTP 200 HTML
 *    fragment with 24 live vacancy cards (CrossReach — Scotland's largest
 *    voluntary social-care charity), each carrying `data-jobId="{id}"` and an
 *    `href="/crossreach/Job/JobDetail?JobId={id}"` detail link.
 *  - `GET https://www.jobtrain.co.uk/crossreach/Job/JobDetail?JobId=14496` →
 *    HTTP 200 HTML with a complete `application/ld+json` `JobPosting`:
 *    `title: "Support Worker - Part Time (Term time only)"`,
 *    `datePosted: "2026-05-28"`, `employmentType: "Term Time"`,
 *    `baseSalary: "£13.65/hour - £14.03/hour (CRB18)"`,
 *    `jobLocation.address.addressLocality: "Motherwell"` /
 *    `addressRegion: "North Lanarkshire"` / `postalCode: "ML1 1JJ"` /
 *    `addressCountry: "GB"`, `hiringOrganization.name: "CrossReach"`.
 *  - Sibling tenants confirmed on the same `www.jobtrain.co.uk/{tenant}/…`
 *    host/path pattern: `citizensadvice`, `thirteen`, `jobtrainsolutions`.
 */

/** Shared Jobtrain career host. Tenants are addressed by a leading path segment. */
export const JOBTRAIN_HOST = 'https://www.jobtrain.co.uk';

/** Root career domain — used to recognise tenant URLs passed via `companyUrl`. */
export const JOBTRAIN_ROOT_DOMAIN = 'jobtrain.co.uk';

/**
 * Public, unauthenticated live-vacancy card partial. `{tenant}` is the career
 * path segment (e.g. `crossreach`). Returns every live role in one HTML
 * fragment.
 */
export const JOBTRAIN_JOBCARD_PATH_TEMPLATE = '/{tenant}/Home/_JobCard';

/**
 * Per-role server-rendered detail-page path. `{tenant}` is the career path
 * segment and `{jobId}` is the numeric ATS id.
 */
export const JOBTRAIN_JOBDETAIL_PATH_TEMPLATE = '/{tenant}/Job/JobDetail?JobId={jobId}';

/**
 * Captures every distinct numeric job id from the `_JobCard` partial. The cards
 * expose the id twice (a `data-jobId` attribute and a `JobDetail?JobId=` link);
 * either form matches, and the service de-duplicates the captured ids.
 */
export const JOBTRAIN_JOBID_REGEX = /(?:data-jobId=["']|JobDetail\?JobId=)(\d+)/gi;

/**
 * Extracts the inner JSON of the first schema.org `JobPosting` JSON-LD block on
 * a detail page (`<script type="application/ld+json">…</script>`).
 */
export const JOBTRAIN_LDJSON_REGEX =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Detects remote / home-working roles across common UK phrasings. */
export const JOBTRAIN_REMOTE_REGEX =
  /\b(remote|home[\s-]?work(?:ing)?|home[\s-]?based|work\s*from\s*home|wfh|hybrid)\b/i;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's live roles.
 */
export const JOBTRAIN_DEFAULT_RESULTS = 100;

/**
 * Bounded per-request timeout (seconds). `ScraperInputDto` defaults
 * `requestTimeout` to 60s, which is longer than typical caller budgets; the
 * Jobtrain host (`www.jobtrain.co.uk`) can connect-then-hang on an unknown or
 * overloaded tenant. Capping at 15s keeps the graceful-degradation path fast
 * (a healthy tenant responds well under a second) while leaving headroom for a
 * legitimately slow first byte. Callers can still request a SHORTER timeout.
 */
export const JOBTRAIN_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The site expects a browser-like UA. */
export const JOBTRAIN_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
};
