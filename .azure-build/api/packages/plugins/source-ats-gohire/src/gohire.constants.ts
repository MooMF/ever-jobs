/**
 * Constants for the GoHire applicant-tracking careers platform.
 *
 * GoHire (gohire.io) hosts the public careers boards of its customers under one
 * shared host, `https://jobs.gohire.io`, with each tenant addressed by a short
 * opaque client hash (e.g. `hrscgarc`). Customer websites embed the same board
 * via a careers widget loaded from `https://widget.gohire.io/widget/{clientHash}`.
 *
 * Two public, unauthenticated JSON endpoints back that board (verified
 * 2026-06-03 against live tenants):
 *
 *   1. List feed (primary):
 *        GET https://api2.gohire.io/widget-jobs/{clientHash}
 *      → { generalApplication, generalPoolID, template, colour,
 *          jobs: GoHireListJob[], language }
 *      The `jobs` array carries one entry per open role with `id`, `title`,
 *      `location` ("City, Country"), `salary`, `type`, a human `date`
 *      ("28 May, 2026") and the public `link` to the job page. An unknown
 *      tenant returns `{}` (HTTP 200, no `jobs` key) — treated as empty.
 *
 *   2. Detail feed (enrichment):
 *        GET https://api.gohire.io/widget-job?clientHash={clientHash}&jobId={id}
 *      → a single rich job object with the employer name (`client.name`),
 *        structured `city` / `county` / `country` and the full HTML
 *        `description` (the list feed leaves `description` empty).
 *
 * We page the list once (it returns the tenant's full open-roles set in one
 * response — no server-side pagination) and fan out to the detail feed with a
 * bounded `Promise.allSettled` to hydrate the HTML description and structured
 * location, slicing client-side to honour `resultsWanted`.
 */

/** Shared public host for every GoHire-hosted careers board. */
export const GOHIRE_HOST = 'https://jobs.gohire.io';

/** Public host serving the careers-widget list feed. */
export const GOHIRE_LIST_API_HOST = 'https://api2.gohire.io';

/** Public host serving the per-job detail feed. */
export const GOHIRE_DETAIL_API_HOST = 'https://api.gohire.io';

/** Public, unauthenticated list-feed path (tenant via the `{clientHash}` segment). */
export const GOHIRE_JOBS_PATH = '/widget-jobs';

/** Public, unauthenticated per-job detail path (tenant + job id via query). */
export const GOHIRE_JOB_DETAIL_PATH = '/widget-job';

/** Maximum number of per-job detail requests to fetch concurrently per tenant. */
export const GOHIRE_MAX_CONCURRENCY = 8;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public
 * DTO default is 15, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const GOHIRE_DEFAULT_RESULTS = 100;

/** Default request headers. GoHire expects a browser-like UA + JSON accept. */
export const GOHIRE_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
