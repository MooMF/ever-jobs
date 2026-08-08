/**
 * Constants for the Factorial HRIS + ATS public career-board platform.
 *
 * Factorial (factorialhr.com) is an HRIS with an integrated ATS that hosts
 * public career pages for each tenant. Every tenant career site is served from
 * its own sub-domain under the shared apex `factorialhr.com`, e.g.
 * `https://jobs-tendencys.factorialhr.com`. A small number of tenants use a
 * custom domain, but the sub-domain form is the canonical entry point.
 *
 * ## Wire surface — server-rendered HTML only (no anonymous JSON API)
 *
 * Factorial's authenticated REST API (`api.factorialhr.com/api/v1/ats/…`)
 * requires OAuth2 bearer credentials and is deliberately NOT used here.
 *
 * The tenant career site is a server-rendered Rails application. All job data
 * is embedded directly in the HTML and **no public JSON API is called by the
 * page itself at load time**. Data extraction therefore proceeds via HTML
 * parsing over two tiers:
 *
 *   Tier 1 — Career-page index (`GET https://{slug}.factorialhr.com/`):
 *
 *     The root page lists every open position grouped by office/location. Each
 *     job entry is a `<li>` element with a `data-controller='job-postings'`
 *     attribute that embeds the job URL, remote flag, location ID and team ID:
 *
 *       data-controller='job-postings'
 *       data-job-postings-url='https://{slug}.factorialhr.com/job_posting/{title-slug}-{id}'
 *       data-is-remote='false'
 *       data-location-id='318886'
 *       data-team-id='95948'
 *       data-contract-type='indefinite'
 *
 *     The heading of each surrounding `<ul>` group (identified by
 *     `data-target='job-filters.officeGroup'`) carries the human-readable
 *     office/city name. A `<select id='location_filter'>` and
 *     `<select id='team_filter'>` with `<option value='{id}'>{name}</option>`
 *     entries provide numeric-ID-to-name lookup tables for locations and teams.
 *
 *     The job title is in the first bold `<div>` inside each list item.
 *
 *   Tier 2 — Job detail page (`GET …/job_posting/{title-slug}-{id}`):
 *
 *     Each detail page embeds the full HTML description inside
 *     `<div class='styledText'>…</div>` and the apply link at
 *     `<a href='/apply/{slug}-{id}'>Apply now</a>`. The sidebar lists
 *     contract type, schedule (Full-time / Part-time), location label, and
 *     team name as `<span>` text nodes inside `<li>` rows.
 *
 *   Sitemap (`GET …/sitemap.xml`):
 *
 *     Exposes all published job-posting URLs alongside a `<lastmod>` date
 *     (YYYY-MM-DD). This is the canonical source for `datePosted` because
 *     neither the index nor the detail page surfaces a machine-readable
 *     publish timestamp.
 *
 * URL patterns (verified 2026-06-03):
 *   Index page:   https://{slug}.factorialhr.com/
 *   Job detail:   https://{slug}.factorialhr.com/job_posting/{title-slug}-{id}
 *   Apply URL:    https://{slug}.factorialhr.com/apply/{title-slug}-{id}
 *   Sitemap:      https://{slug}.factorialhr.com/sitemap.xml
 *   Job ID:       last hyphen-separated numeric token in the detail URL path
 *                 (e.g. "ai-developer-304592" → id "304592")
 *
 * Verified live against `jobs-tendencys.factorialhr.com` on 2026-06-03
 * (HTTP 200, 22 jobs, fully shaped HTML with styledText description and
 * office-grouped listing with data-* attributes).
 */

/** Shared apex for every Factorial-hosted tenant career sub-domain. */
export const FACTORIAL_APEX = 'factorialhr.com';

/**
 * Host template for Factorial-hosted tenants; `{slug}` is substituted at
 * runtime with the company slug (sub-domain label).
 */
export const FACTORIAL_HOST_TEMPLATE = 'https://{slug}.factorialhr.com';

/** Path of the sitemap; contains all job-posting URLs + lastmod dates. */
export const FACTORIAL_SITEMAP_PATH = '/sitemap.xml';

/** URL path prefix for job-detail pages. */
export const FACTORIAL_JOB_DETAIL_PREFIX = '/job_posting/';

/** URL path prefix for the apply page. */
export const FACTORIAL_APPLY_PREFIX = '/apply/';

/**
 * Maximum number of job-detail pages to fetch concurrently per tenant.
 * Detail fetches are needed for the description and apply URL.
 */
export const FACTORIAL_MAX_CONCURRENCY = 6;

/** Polite delay (ms) between concurrent detail-fetch rounds. */
export const FACTORIAL_REQUEST_DELAY_MS = 300;

/**
 * Default internal results cap. When a caller omits `resultsWanted` entirely
 * we ingest up to this many of the tenant's open roles.
 */
export const FACTORIAL_DEFAULT_RESULTS = 100;

/** Default request headers for the Factorial career-page fetch. */
export const FACTORIAL_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
