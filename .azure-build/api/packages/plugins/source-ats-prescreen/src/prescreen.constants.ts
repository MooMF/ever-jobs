/**
 * Constants for the Prescreen (prescreen.io) applicant-tracking platform.
 *
 * Prescreen is an Austrian cloud ATS (Vienna-based Prescreen International GmbH,
 * now part of the XING / NEW WORK SE group). Every customer tenant publishes a
 * public, anonymous, candidate-facing career portal served from its own
 * sub-domain. The candidate-facing host has been rebranded over time:
 *
 *   - Legacy:  `https://{handle}.jobbase.io/`
 *   - Legacy:  `https://{handle}.prescreenapp.io/`
 *   - Current: `https://{handle}.onlyfy.jobs/`   ← canonical (301 from legacy)
 *
 * Both legacy hosts now issue HTTP 301 redirects to the current
 * `{handle}.onlyfy.jobs` host, so this adapter resolves every tenant to the
 * canonical host and lets the HTTP client follow redirects. The `{handle}` is
 * the tenant's stable account slug (e.g. `v2c2`, `eurogarages`) and is taken
 * from `companySlug`, or derived from the first sub-domain label of
 * `companyUrl`.
 *
 * The portal is server-rendered HTML (no anonymous JSON API on the candidate
 * host — the JSON job feed at `api.prescreenapp.io` requires an `apikey`
 * header and is deliberately NOT used). Three anonymous surfaces are scraped:
 *
 *   1. **Listing page** — `GET https://{handle}.onlyfy.jobs/`
 *      Returns an HTML page with a `<div id="jobList">` container. Each open
 *      role is a `<div class="row row-table ...">` row holding:
 *        - `<strong class="job-title"><a href="/job/{token}">Title</a></strong>`
 *        - a location cell:
 *          `<div class="cell-table ... text-center"><div class="inner">City</div></div>`
 *      The `{token}` is an opaque 32-char job slug used in the detail URL.
 *
 *   2. **Job detail page** — `GET https://{handle}.onlyfy.jobs/job/{token}`
 *      Embeds a `schema.org` `JobPosting` JSON-LD block
 *      (`<script type="application/ld+json">`) carrying the richest structured
 *      fields: `title`, `datePosted` (YYYY-MM-DD), `validThrough`,
 *      `employmentType`, `jobLocation.address`
 *      (`addressLocality` / `addressCountry` / `postalCode`),
 *      `jobLocationType` (`"TELECOMMUTE"` ⇒ remote), `hiringOrganization.name`,
 *      `baseSalary`, and `identifier.value` (a stable short job id, e.g.
 *      `"wmo5fb98"`). The inline `description` in the JSON-LD is a truncated
 *      (~200-char) summary — the full body lives in the fragment below.
 *
 *   3. **Full job-ad fragment** — `GET /job/show/{token}/full?lang=en&mode=candidate`
 *      The iframe (`<iframe id="jobFrame" src="...">`) source on the detail
 *      page. Returns the complete HTML job-ad body (the full description).
 *
 * Verified live against `https://v2c2.onlyfy.jobs/` (Virtual Vehicle Research
 * GmbH) on 2026-06-03:
 *   - `GET /` → HTTP 200, HTML with `#jobList` and 3 `/job/{token}` rows.
 *   - `GET /job/{token}` → HTTP 200, JSON-LD `JobPosting` with all fields above.
 *   - `GET /job/show/{token}/full?lang=en&mode=candidate` → HTTP 200, full HTML
 *     job-ad body (~30 KB of text content).
 *   - `https://v2c2.jobbase.io/` and `https://v2c2.prescreenapp.io/` → 301 to
 *     `https://v2c2.onlyfy.jobs/`.
 *   - `app.prescreenapp.io/job/list/{handle}?format=json` → HTTP 404 for every
 *     tested handle (anonymous JSON feed retired for the candidate surface).
 *
 * A missing tenant, an HTTP error, or a malformed payload degrades to an
 * empty/partial result and never throws, so a single tenant never aborts a
 * batch run.
 */

/** Canonical candidate-facing apex for every Prescreen tenant career portal. */
export const PRESCREEN_APEX = 'onlyfy.jobs';

/**
 * Host template for the canonical candidate career portal.
 * `{handle}` is substituted at runtime with the tenant account slug.
 */
export const PRESCREEN_HOST_TEMPLATE = 'https://{handle}.onlyfy.jobs';

/**
 * Legacy candidate-facing apex domains. Tenants on these hosts 301-redirect to
 * the canonical `onlyfy.jobs` host; listed here only so `companyUrl` values
 * pointing at a legacy host can be normalised to the canonical sub-domain.
 */
export const PRESCREEN_LEGACY_APEXES = ['jobbase.io', 'prescreenapp.io'] as const;

/** Path template for the public job-detail page. `{token}` is the opaque job slug. */
export const PRESCREEN_JOB_DETAIL_PATH = '/job/{token}';

/**
 * Path template for the full job-ad HTML fragment (the detail page's iframe
 * source). `{token}` is the opaque job slug. Returns the complete description
 * body that is only truncated in the detail page's JSON-LD.
 */
export const PRESCREEN_JOB_FULL_PATH = '/job/show/{token}/full';

/** Query parameters appended to the full job-ad fragment request. */
export const PRESCREEN_FULL_QUERY: Record<string, string> = {
  lang: 'en',
  mode: 'candidate',
};

/** CSS selector for the job-listing container on the portal landing page. */
export const PRESCREEN_JOB_LIST_SELECTOR = '#jobList';

/** CSS selector for a single job row inside the listing container. */
export const PRESCREEN_JOB_ROW_SELECTOR = 'div.row-table';

/** CSS selector for the job title anchor inside a listing row. */
export const PRESCREEN_JOB_TITLE_SELECTOR = 'strong.job-title a';

/**
 * CSS selector for the location cell inside a listing row. The location is the
 * text of the `.inner` div within the centre-aligned table cell.
 */
export const PRESCREEN_JOB_LOCATION_SELECTOR = 'div.text-center div.inner';

/** Maximum number of detail-fetch calls issued concurrently per round. */
export const PRESCREEN_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential detail-fetch rounds, to stay polite. */
export const PRESCREEN_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. The public DTO default is 15, but when a caller
 * omits `resultsWanted` entirely we ingest up to this many of the tenant's open
 * roles.
 */
export const PRESCREEN_DEFAULT_RESULTS = 100;

/**
 * Default request headers. The portal is a plain HTML host, so a browser-like
 * Accept and User-Agent are polite and reduce the chance of WAF gating.
 */
export const PRESCREEN_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
};
