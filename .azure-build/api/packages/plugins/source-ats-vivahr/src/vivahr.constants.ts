/**
 * Constants for the VivaHR applicant-tracking careers platform.
 *
 * VivaHR hosts the public careers sites of its customers under one shared host,
 * `https://jobs.avahr.com` (the platform's careers domain), with each tenant
 * addressed by an `{id}-{slug}` path segment (e.g. `/236-avahr`). There is **no**
 * anonymous JSON jobs API — the developer API (`developer.vivahr.com`) requires a
 * per-tenant API key. The public surface is server-rendered HTML:
 *
 *   GET https://jobs.avahr.com/{tenant}/jobs
 *     → an HTML listing whose anchors link to each open role's detail page:
 *       https://jobs.avahr.com/{tenant}/{jobId}-{jobSlug}/
 *
 *   GET https://jobs.avahr.com/{tenant}/{jobId}-{jobSlug}/
 *     → an HTML detail page embedding a complete schema.org `JobPosting`
 *       block inside a `<script type="application/ld+json">` tag (title,
 *       description HTML, datePosted, employmentType, hiringOrganization,
 *       jobLocation/PostalAddress, jobLocationType, baseSalary, identifier).
 *
 * The adapter therefore fetches the listing HTML to enumerate role URLs, then
 * parses the JSON-LD on each detail page. The tenant is taken from `companySlug`
 * (the `{id}-{slug}` path token) or derived from a `companyUrl`. An unknown
 * tenant yields HTTP 404 / 301-to-marketing, which we treat as an empty
 * (graceful) result rather than an error.
 */

/** Shared public careers host for every VivaHR-hosted careers site. */
export const VIVAHR_HOST = 'https://jobs.avahr.com';

/** Public, unauthenticated jobs listing path template (`{tenant}` = `{id}-{slug}`). */
export const VIVAHR_JOBS_PATH_TEMPLATE = '/{tenant}/jobs';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is 15, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const VIVAHR_DEFAULT_RESULTS = 100;

/**
 * Maximum number of job-detail pages to fetch concurrently per tenant. The
 * listing page yields every role URL; we fan-out the per-role JSON-LD fetches
 * with a bounded concurrency so a busy tenant never floods the upstream host.
 */
export const VIVAHR_MAX_CONCURRENCY = 6;

/** Default request headers. VivaHR serves plain HTML; send a browser-like UA. */
export const VIVAHR_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
