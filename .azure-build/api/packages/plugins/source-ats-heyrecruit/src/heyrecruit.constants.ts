/**
 * Constants for the Heyrecruit applicant-tracking careers platform.
 *
 * Heyrecruit (heyrecruit.de) is a German "Performance Recruiting" ATS built by
 * Artrevolver GmbH (Frankfurt am Main). Every customer tenant publishes a
 * branded, public, server-rendered careers portal on its own Heyrecruit
 * sub-domain:
 *
 *   https://{subdomain}.heyrecruit.de/?page=jobs   → the open-roles overview
 *   https://{subdomain}.heyrecruit.de/?page=job&id={jobId}&location={locationId}
 *                                                   → a single job-detail page
 *
 * The platform's structured JSON REST API lives at
 * `https://app.heyrecruit.de/api/v2` (e.g. `companies/view-by-domain`,
 * `jobs/index`) but it is GATED behind a JWT bearer token obtained from a
 * per-tenant `client_id` / `client_secret` pair — i.e. it is NOT public and is
 * deliberately not used by this adapter.
 *
 * The PUBLIC surface this adapter targets is the anonymous careers portal HTML.
 * Heyrecruit's own overview template (`hr_jobs_list` / `jobs_table_row`) renders
 * each open role as a `<div class="job-tile">` whose anchors carry an inline
 * `onclick="jobClickEventListener({...json...})"` attribute. That attribute
 * embeds the COMPLETE job record exactly as the REST API returns it — every job
 * tile therefore ships a full, machine-readable JSON object with no
 * authentication required. We harvest those embedded objects with cheerio and
 * map them directly; the visible tile text (title, location, employment,
 * department, detail link) is a layered fallback for markup drift.
 *
 * The portal renders every open role in one overview page (no server-side
 * pagination for typical tenants), so we parse once and slice client-side to
 * honour `resultsWanted`. An unknown sub-domain (HTTP 4xx / empty body) degrades
 * to an empty result rather than throwing, so one bad tenant never nukes a batch.
 */

/** Shared hosted-careers host suffix for every Heyrecruit tenant sub-domain. */
export const HEYRECRUIT_HOST_SUFFIX = 'heyrecruit.de';

/**
 * Host template for a tenant's hosted careers portal. `{subdomain}` is the
 * tenant's Heyrecruit account handle (its careers sub-domain label).
 */
export const HEYRECRUIT_HOST_TEMPLATE = 'https://{subdomain}.heyrecruit.de';

/** Public, anonymous open-roles overview page (relative to the tenant host). */
export const HEYRECRUIT_JOBS_PATH = '/?page=jobs';

/**
 * Public job-detail page template (relative to the tenant host). `{jobId}` is
 * the numeric job id and `{locationId}` the company-location id; both come from
 * the embedded job record.
 */
export const HEYRECRUIT_JOB_PATH_TEMPLATE = '/?page=job&id={jobId}&location={locationId}';

/** CSS selector for each open-role card on the overview page. */
export const HEYRECRUIT_JOB_TILE_SELECTOR = '.job-tile';

/** CSS selector for the job title heading inside a tile (text fallback). */
export const HEYRECRUIT_JOB_TITLE_SELECTOR = 'h2';

/**
 * Regex matching the inline `jobClickEventListener({...})` handler that
 * Heyrecruit emits on every job-tile anchor. Capture group 1 is the raw
 * (HTML-entity-encoded) JSON object — the full job record.
 */
export const HEYRECRUIT_JOB_CLICK_REGEX = /jobClickEventListener\((\{[\s\S]*?\})\)/;

/** Regex pulling the numeric job id out of a `?page=job&id={n}` detail URL. */
export const HEYRECRUIT_JOB_ID_REGEX = /[?&]id=(\d+)/;

/** Regex pulling the company-location id out of a `&location={n}` detail URL. */
export const HEYRECRUIT_LOCATION_ID_REGEX = /[?&]location=(\d+)/;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const HEYRECRUIT_DEFAULT_RESULTS = 100;

/** Default request headers. The portal expects a browser-like UA. */
export const HEYRECRUIT_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
};
