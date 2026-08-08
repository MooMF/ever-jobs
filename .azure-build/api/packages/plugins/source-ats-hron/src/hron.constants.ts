/**
 * Constants for the HR-ON Recruit applicant-tracking careers platform.
 *
 * HR-ON Recruit (hr-on.com) is a Danish e-recruitment suite (HR-ON ApS, Odense).
 * Each customer tenant gets a branded, GDPR-compliant career page rendered by
 * HR-ON; a core selling point is that "candidates remain on the company's own
 * website throughout the application process", so the public surface is
 * server-rendered HTML rather than a documented anonymous JSON feed.
 *
 * Public surface (verified live 2026-06-03 against HR-ON's own tenant —
 * HR-ON ApS — at `https://hr-on.com/careers/`):
 *
 *   GET {careerPageUrl}                       (the tenant's public career page)
 *     → HTML listing one block per open role. Every role links to its detail
 *       page via an anchor whose href matches:
 *           /jobposts_en?jobid={ID}            (English UI)
 *           /jobposts?jobid={ID}               (Danish / default UI)
 *       The numeric `{ID}` (e.g. 318814) is the stable HR-ON job id (ATS id).
 *
 *   GET {careerPageUrl-origin}/jobposts_en?jobid={ID}
 *     → server-rendered HTML detail page carrying the job title (<h1>/<h2>),
 *       work-location text ("Work location :" / "Arbejdssted :"), company name,
 *       application deadline, and the full job-ad body.
 *
 * The `?jobid=` anchor is the stable cross-tenant contract: it is emitted on
 * every HR-ON career page regardless of the tenant's branding/theme, so the
 * adapter harvests those links by pattern (not by brittle CSS class names) and
 * then fans out to each detail page. There is no server-side pagination on the
 * career page — every open role is rendered in one document — so we slice
 * client-side to honour `resultsWanted`.
 *
 * Tenant addressing: the adapter is keyed by `companyUrl` (the tenant's public
 * career-page URL, e.g. `https://hr-on.com/careers/`) or by `companySlug`,
 * which is expanded against HR-ON's hosted career path when it is a bare slug.
 * An unknown tenant (HTTP 4xx) or a malformed page degrades to an empty result.
 */

/**
 * Canonical HR-ON host. Used to (a) expand a bare `companySlug` into a hosted
 * career-page URL and (b) absolutise relative `/jobposts*` detail links.
 */
export const HRON_HOST = 'https://hr-on.com';

/**
 * Hosted career-page path template for a bare `companySlug`. HR-ON's own public
 * career page lives at `/careers/`; tenant career pages are most reliably
 * addressed by their full `companyUrl`, so the slug form is a best-effort
 * convenience that targets the HR-ON-hosted `/{slug}/careers/` layout.
 */
export const HRON_CAREER_PATH_TEMPLATE = '/{slug}/careers/';

/** Fallback hosted career page used when a slug cannot be expanded. */
export const HRON_DEFAULT_CAREER_PATH = '/careers/';

/**
 * Detail-page path template. `{id}` is the numeric HR-ON job id harvested from
 * the career-page listing. The English (`jobposts_en`) variant is requested
 * first; HR-ON serves the role regardless of UI language.
 */
export const HRON_JOB_PATH_TEMPLATE = '/jobposts_en?jobid={id}';

/**
 * Matches an HR-ON job-detail link in career-page HTML and captures the numeric
 * job id. Tolerates the English (`jobposts_en`) and default (`jobposts`) UI
 * paths, an optional trailing slash, and other query params in any order.
 */
export const HRON_JOBID_LINK_REGEX = /\/jobposts(?:_[a-z]{2})?\/?\?[^"'#\s]*\bjobid=(\d+)/gi;

/** Matches a bare `jobid=NNN` query token (used to read an id off any URL). */
export const HRON_JOBID_PARAM_REGEX = /\bjobid=(\d+)/i;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller
 * omits `resultsWanted` we ingest up to 100 of the tenant's open roles.
 */
export const HRON_DEFAULT_RESULTS = 100;

/** Max concurrent detail-page fetches per fan-out round. */
export const HRON_MAX_CONCURRENCY = 6;

/** Polite delay (ms) between fan-out rounds. */
export const HRON_REQUEST_DELAY_MS = 250;

/** Default request headers. HR-ON career pages expect a browser-like UA. */
export const HRON_HEADERS: Record<string, string> = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,da;q=0.8',
};
