/**
 * Constants for the LiveHire (Humanforce Talent) careers platform.
 *
 * LiveHire (livehire.com, Australia / global) is a talent-community / recruitment
 * ATS now part of Humanforce. Every customer tenant publishes a branded, public,
 * unauthenticated talent-community careers board on the shared host, addressed by
 * its company slug:
 *
 *   https://www.livehire.com/careers/{tenant}/jobs        (candidate-facing SPA)
 *   https://www.livehire.com/talent/community/{tenant}/careers/   (community shell)
 *
 * The `/careers/{tenant}/jobs` page is a client-rendered SPA, and the JSON API the
 * SPA calls answers 403 to non-browser clients — so it is not a reliable scraping
 * surface. LiveHire, however, also exposes a **server-rendered, public,
 * unauthenticated** embeddable jobs widget for the same tenant, keyed by the same
 * company slug, which lists every open role with a stable per-job link:
 *
 *   GET https://www.livehire.com/widgets/job-listings/{tenant}
 *     → server-rendered HTML listing each open role as an anchor of the form
 *       https://www.livehire.com/careers/{tenant}/job/{CODE}/{ID}/{title-slug}?useBrowserBack=true
 *       alongside labelled card text: the role title (heading), "Location …",
 *       "Work Type …", optional "Salary Range …", and "Published At: …".
 *
 * Each role's canonical public detail / apply URL is the careers job page:
 *
 *   https://www.livehire.com/careers/{tenant}/job/{CODE}/{ID}/{title-slug}
 *
 * The `{ID}` path segment (an opaque LiveHire job id, e.g. `MZV481L9JF`) is the
 * stable ATS id; `{CODE}` is a short company/job code. The adapter parses the
 * widget HTML — extracting each job anchor and the labelled fields immediately
 * around it — rather than depending on volatile CSS class names. An unknown tenant
 * (or one with no open roles) renders a "Showing 0 of 0 / No open positions"
 * widget, so it degrades naturally to an empty result. A fetch error, an HTTP 4xx,
 * a DNS failure, or a malformed body degrades to an empty / partial result rather
 * than throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing
 *    (`www.livehire.com/careers/{tenant}/jobs`, mirrored by the public widget
 *    `www.livehire.com/widgets/job-listings/{tenant}`) and a real, named tenant on
 *    it: `perthmint` (The Perth Mint, 14 open roles at time of research).
 *  - Confirmed the server-rendered widget lists each role with the canonical job
 *    URL shape `https://www.livehire.com/careers/{tenant}/job/{CODE}/{ID}/{slug}`
 *    and the labelled card fields above (verified=true). Other live tenants seen:
 *    `melbourneairport`, `livehire`, `workandtraining`, `juniper`, `nextsource`.
 */

/** Canonical public careers host (candidate-facing SPA + server-rendered widget). */
export const LIVEHIRE_BASE = 'https://www.livehire.com';

/** Root domain — used to recognise tenant hosts/URLs passed via `companyUrl`. */
export const LIVEHIRE_ROOT_DOMAIN = 'livehire.com';

/**
 * Public, server-rendered embeddable jobs-widget path. Keyed by company slug; lists
 * every open role with its canonical careers job URL. This is the scraping surface.
 */
export const LIVEHIRE_WIDGET_PATH = '/widgets/job-listings/';

/** Public careers-board path segment (used to build/parse canonical job URLs). */
export const LIVEHIRE_CAREERS_PATH = '/careers/';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const LIVEHIRE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on widget pages fetched per scrape. The widget renders the full
 * tenant board in a single document (with a client-side "Show more" control), so
 * one page is the norm; the ceiling guards any future server-side pagination.
 */
export const LIVEHIRE_MAX_PAGES = 50;

/** Default request headers. The widget expects a browser-like UA + HTML Accept. */
export const LIVEHIRE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches a canonical LiveHire careers job link inside the widget HTML, capturing
 * the tenant, the short code, the opaque job id, and the title slug:
 *   /careers/{tenant}/job/{CODE}/{ID}/{title-slug}
 */
export const LIVEHIRE_JOB_LINK_REGEX =
  /\/careers\/([^/"'\s]+)\/job\/([^/"'\s]+)\/([^/"'\s]+)\/([^"'?#\s]+)/gi;

/** Detects remote / home-working roles across the title, location, and work-type fields. */
export const LIVEHIRE_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
