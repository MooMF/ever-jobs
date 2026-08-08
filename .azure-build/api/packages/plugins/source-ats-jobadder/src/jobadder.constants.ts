/**
 * Constants for the JobAdder recruitment platform.
 *
 * JobAdder powers the public careers sites ("Careerpages") of thousands of
 * recruitment agencies and employers. Each tenant's Careerpage is hosted by
 * JobAdder under one shared host, `https://clientapps.jobadder.com`, addressed
 * by a numeric account id plus a short board slug in the path:
 *
 *   GET https://clientapps.jobadder.com/{accountId}/{slug}
 *       → server-rendered HTML listing of the tenant's currently open roles
 *
 * Each listing card links to a public job-detail page:
 *
 *   GET https://clientapps.jobadder.com/{accountId}/{slug}/{jobId}/{title-slug}
 *       → server-rendered HTML with the full job description
 *
 * Both pages are fully anonymous (no auth, no cookies, no key). The Careerpage
 * is JobAdder's hosted, no-customisation "Jobs on your Website" option; the
 * feed it renders is refreshed by JobAdder roughly every 15 minutes.
 *
 * JobAdder's only structured JSON job feed (the v2 `/jobboards/{boardId}/ads`
 * REST API) requires OAuth2 (`read_jobad` / `partner_jobboard` scopes) and is
 * therefore unusable anonymously; the JavaScript widget endpoints
 * (`/widgets/V1/Jobs/RenderJobList`) return server-rendered HTML fragments keyed
 * by an opaque widget key rather than a tenant slug. The hosted Careerpage is
 * the only anonymous, slug-addressable public surface, so we scrape its HTML.
 *
 * Verified live 2026-06-03 against the `84381/eq8-recruit` tenant (4 open roles
 * returned; an unknown account/slug returns HTTP 404).
 */

/** Shared public host for every JobAdder-hosted Careerpage. */
export const JOBADDER_HOST = 'https://clientapps.jobadder.com';

/**
 * Careerpage listing path template (`{accountId}` + `{slug}` substituted). The
 * page server-renders every open role for the tenant in a single response.
 */
export const JOBADDER_LISTING_PATH_TEMPLATE = '/{accountId}/{slug}';

/**
 * Job-detail page path template (`{accountId}`, `{slug}`, `{jobId}`, `{titleSlug}`
 * substituted). Used both to identify a role's ATS id and to fetch its full
 * description HTML.
 */
export const JOBADDER_JOB_PATH_TEMPLATE = '/{accountId}/{slug}/{jobId}/{titleSlug}';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is 15, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const JOBADDER_DEFAULT_RESULTS = 100;

/** Maximum number of job-detail pages to fetch concurrently per tenant. */
export const JOBADDER_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential detail-fetch rounds, to stay polite. */
export const JOBADDER_REQUEST_DELAY_MS = 250;

/** Default request headers. JobAdder Careerpages expect a browser-like UA. */
export const JOBADDER_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
