/**
 * Constants for the Tribepad ATS platform.
 *
 * Tribepad is a UK enterprise Applicant Tracking System that powers public
 * career sites for employers such as Tesco, Greggs, NHS Professionals, YPO,
 * and many others. Each employer's career site is hosted on one of two
 * Tribepad-managed domains or on a fully custom domain:
 *
 *   1. `https://{slug}.tribepad-gro.com` — used by SME and mid-market
 *      tenants on the Tribepad Gro product tier.
 *   2. `https://{slug}.tribepad.com` — used by select tenants on the core
 *      enterprise tier.
 *   3. Custom domains (e.g. `https://apply.tesco-careers.com`) — enterprise
 *      tenants that front the Tribepad platform with their own domain.
 *
 * Tribepad does NOT expose a public, anonymous JSON API. All three domain
 * patterns serve server-rendered PHP HTML. The page at `/v2/job/search` (or
 * `/v2/vacancies` for some tenants) renders a paginated list of open roles
 * using a consistent sitebuilder template. Each job card carries:
 *
 *   - `.sitebuilder-job-results-item` — outer wrapper per listing
 *   - `a[href*="detail.php?record="]` — anchor whose `href` encodes the job's
 *     numeric record ID and whose text is the job title
 *   - `.sitebuilder-job-results-item-title` — `<h3>` element containing the title
 *   - `.sitebuilder-job-results-item-meta` — container for all meta chips
 *     - `fa-map-marker-alt` icon sibling → location text
 *     - `fa-wallet` icon sibling → salary text
 *     - `fa-tag` icon sibling → category / work-type text
 *     - `fa-clock` icon sibling → contract type text
 *     - `fa-calendar-times` icon sibling → application closing date (DD/MM/YY)
 *
 * The total result count is embedded as `<h2>{n} Search Results</h2>` on the
 * search-results page. Pagination uses `?page={n}` query parameter.
 *
 * Individual job detail pages live at:
 *   `/members/modules/job/detail.php?record={id}`
 * They carry the full HTML job description inside `#job-advert-wrapper`
 * (`section.job-details-section`). No JSON-LD / schema.org structured data is
 * embedded; description is raw HTML. Closing date appears as
 * `fa-calendar-check` icon sibling in the format `DD/MM/YYYY`. The job
 * reference number (`{slug}/TP/{org}/{id}`) is also present as plain text
 * next to the "Reference" label.
 *
 * Apply link pattern: `/members/?j={id}` (relative to the tenant host).
 *
 * Verified live against `getsetuk.tribepad-gro.com` (18 jobs, paginated 10
 * per page, 2026-06-03). Also tested against `ypocareers.tribepad-gro.com`
 * (3 jobs, 2026-06-03).
 */

/** Shared apex for Tribepad Gro-tier tenants; `{slug}` is substituted at runtime. */
export const TRIBEPAD_GRO_HOST_TEMPLATE = 'https://{slug}.tribepad-gro.com';

/** Shared apex for Tribepad enterprise-tier tenants; `{slug}` is substituted at runtime. */
export const TRIBEPAD_ENTERPRISE_HOST_TEMPLATE = 'https://{slug}.tribepad.com';

/**
 * The primary public job-search page path used by Tribepad-hosted career
 * sites. Accepts `?page={n}&records_per_page={size}` query parameters.
 * Some tenants use `/v2/vacancies` as an alternate landing slug; both
 * redirect to the same underlying paginated search, but `/v2/job/search`
 * works universally and is used for all fetches.
 */
export const TRIBEPAD_SEARCH_PATH = '/v2/job/search';

/** URL path for a single job detail page; `{id}` is the numeric record id. */
export const TRIBEPAD_JOB_DETAIL_PATH = '/members/modules/job/detail.php?record={id}';

/** Apply-link path template; `{id}` is the numeric record id. */
export const TRIBEPAD_APPLY_PATH = '/members/?j={id}';

/** Number of results requested per search page. Tribepad supports up to 50. */
export const TRIBEPAD_PAGE_SIZE = 10;

/**
 * Maximum number of additional search pages to fetch concurrently per tenant.
 * Tribepad pages are server-rendered PHP; the platform is on shared hosting
 * for many tenants, so keep concurrency conservative.
 */
export const TRIBEPAD_MAX_CONCURRENCY = 4;

/** Polite delay (ms) between sequential pagination rounds. */
export const TRIBEPAD_REQUEST_DELAY_MS = 300;

/**
 * Default internal results cap. When a caller omits `resultsWanted` we ingest
 * up to 100 of the tenant's open roles before slicing.
 */
export const TRIBEPAD_DEFAULT_RESULTS = 100;

/**
 * Default request headers. Tribepad serves standard HTML pages and works
 * with a browser-like UA without additional special headers.
 */
export const TRIBEPAD_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * CSS selector targeting the outer container of each job listing card on the
 * Tribepad sitebuilder search-results page.
 */
export const TRIBEPAD_JOB_CARD_SELECTOR = '.sitebuilder-job-results-item';

/**
 * CSS selector for the job title `<h3>` element within a job card.
 */
export const TRIBEPAD_JOB_TITLE_SELECTOR = '.sitebuilder-job-results-item-title';

/**
 * CSS selector for the meta-chip container within a job card. Icon siblings
 * inside this element carry location, salary, category, contract type, and
 * closing date.
 */
export const TRIBEPAD_JOB_META_SELECTOR = '.sitebuilder-job-results-item-meta';

/**
 * CSS selector for the job description section on the detail page.
 * Tribepad wraps the full HTML description inside a `<section>` with class
 * `job-details-section` inside `#job-advert-wrapper`.
 */
export const TRIBEPAD_DETAIL_DESCRIPTION_SELECTOR = 'section.job-details-section';
