/**
 * Constants for the Sage HR (sage.hr) recruitment careers platform.
 *
 * Sage HR (formerly CakeHR) is a UK / global cloud HR + ATS suite. Each customer
 * publishes a public, anonymous candidate careers site ("Vacancies") hosted on
 * the shared recruitment host `talent.sage.hr`, addressed by the tenant's career
 * site identifier — a UUID (e.g. `cf0157f8-8d5e-4d2a-a9f7-0a80b348b097`):
 *
 *   GET https://talent.sage.hr/{careerSiteId}/vacancies
 *
 * Data surface (no authentication required) — VERIFIED LIVE on 2026-06-03:
 *
 *   1. **Vacancies listing** — `GET https://talent.sage.hr/{careerSiteId}/vacancies`
 *      Returns a server-rendered HTML page. The tenant display name lives in the
 *      page `<h1>` (e.g. "🇩🇪 Newstel Worldwide HQ - Hamburg, Germany"), and the
 *      open roles render as a list of `<div class="job">` cards inside
 *      `<div class="other-jobs ...">`. Each card:
 *        - `a.title[href]` → job title text + relative detail URL `/jobs/{positionId}`
 *        - `.location`     → free-text location label (e.g. "Germany")
 *      The detail-page path is `/jobs/{positionId}` where `{positionId}` is the
 *      position UUID used as the ATS id. The full open-roles list renders on one
 *      page (no pagination for typical tenants).
 *
 *   2. **Position detail page** — `GET https://talent.sage.hr/jobs/{positionId}`
 *      Returns a server-rendered HTML page. The richer presentational fields:
 *        - `.title-wrap h1`        → job title
 *        - `.heading .logo-wrap a[href]` → `/{careerSiteId}/vacancies` (tenant link)
 *        - `.heading .logo-wrap img[alt]` → short company / tenant name
 *        - `ul.with-ticks > li:first` → employment type chip (e.g. "Full-time")
 *        - `ul.with-ticks > li.globe-tick` → location chip (e.g. "Germany")
 *        - `.blocks article.block .block-content.wysiwyg` → description blocks
 *            (HTML; concatenated in document order for the full job description)
 *      The page itself is the apply page (`<form action="/jobs/{positionId}">`).
 *
 * Verified live on 2026-06-03 against `talent.sage.hr/cf0157f8-8d5e-4d2a-a9f7-0a80b348b097`
 * (Newstel Worldwide HQ): `GET /{careerSiteId}/vacancies` → HTTP 200 with two
 * `<div class="job">` cards (`/jobs/{uuid}` anchors + `.location`).
 * `GET /jobs/d72fcc99-6a2e-4682-8fd8-4273e80d0bf9` → HTTP 200 with the
 * `.with-ticks` employment-type / location chips and six `.block-content.wysiwyg`
 * description blocks.
 *
 * Tenant resolution: the `{careerSiteId}` is taken from `companySlug` (the career
 * site UUID) or derived from a `companyUrl` (its `/{careerSiteId}/vacancies` or
 * `/jobs/{positionId}` path segment, or a path UUID).
 *
 * The authenticated Sage HR REST API (`/api/recruitment/positions`, requiring an
 * `X-Auth-Token` header) is NOT used — only the public candidate careers site.
 *
 * A missing tenant, an HTTP error, or a malformed payload degrades to an
 * empty/partial result — never throws — so a single tenant never aborts a
 * batch run.
 */

/** Shared public recruitment host for every Sage HR tenant careers site. */
export const SAGEHR_HOST = 'https://talent.sage.hr';

/**
 * Public, unauthenticated vacancies-listing path template. `{careerSiteId}` is
 * the tenant's career site UUID.
 */
export const SAGEHR_LISTING_PATH_TEMPLATE = '/{careerSiteId}/vacancies';

/**
 * Public, unauthenticated position-detail path template. `{positionId}` is the
 * position UUID (also used as the ATS id).
 */
export const SAGEHR_JOB_PATH_TEMPLATE = '/jobs/{positionId}';

/**
 * Regex that extracts the position UUID from a `/jobs/{positionId}` detail URL.
 * Sage HR position ids are UUIDs, but the pattern tolerates any opaque id slug.
 */
export const SAGEHR_JOB_ID_REGEX = /\/jobs\/([^/?#]+)/i;

/** UUID matcher used when deriving a career site id from a free-text companyUrl. */
export const SAGEHR_UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** CSS selector for each job card on the vacancies listing page. */
export const SAGEHR_JOB_CARD_SELECTOR = 'div.job';

/** CSS selector for the title anchor within a job card (and the detail page). */
export const SAGEHR_JOB_TITLE_SELECTOR = 'a.title';

/** CSS selector for the free-text location label within a job card. */
export const SAGEHR_JOB_LOCATION_SELECTOR = '.location';

/** CSS selector for the tenant display name on the listing page. */
export const SAGEHR_COMPANY_HEADING_SELECTOR = 'h1';

/** CSS selector for the job title heading on a position detail page. */
export const SAGEHR_DETAIL_TITLE_SELECTOR = '.title-wrap h1';

/** CSS selector for the employment-type / location chip list on a detail page. */
export const SAGEHR_DETAIL_CHIPS_SELECTOR = 'ul.with-ticks li';

/** CSS selector for the location chip on a detail page. */
export const SAGEHR_DETAIL_LOCATION_CHIP_SELECTOR = 'ul.with-ticks li.globe-tick';

/** CSS selector for the company logo (its `alt` carries the short tenant name). */
export const SAGEHR_DETAIL_LOGO_SELECTOR = '.heading .logo-wrap img';

/** CSS selector for the description-block bodies on a detail page. */
export const SAGEHR_DETAIL_BLOCK_SELECTOR = '.blocks article.block .block-content';

/**
 * Maximum number of detail-page fetches issued concurrently per round. The
 * detail page enriches a listing row with employment type, structured location,
 * and the full description body.
 */
export const SAGEHR_MAX_CONCURRENCY = 5;

/** Delay (ms) between sequential concurrency rounds, to stay polite. */
export const SAGEHR_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. When `resultsWanted` is omitted we ingest up to
 * this many of the tenant's open roles.
 */
export const SAGEHR_DEFAULT_RESULTS = 100;

/**
 * Default request headers. The careers site is served as browser-targeted HTML
 * behind a CDN; a browser-like Accept / User-Agent is polite and avoids trivial
 * bot gating.
 */
export const SAGEHR_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
