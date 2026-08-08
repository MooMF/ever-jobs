/**
 * Spec 006 / T07 — Join.com REST constants.
 *
 * The values mirror the upstream Python reference
 * (`OTHERS/Ats-scrapers/join_com/api_client.py`) so a future
 * contributor can `git diff` the two surfaces and convince themselves
 * the wire shape matches:
 *   - Step 1 hits `https://join.com/companies/<slug>` (HTML) and
 *     extracts the numeric company id with a primary regex
 *     (`"company":{"id":(\d+)`) and a fallback regex
 *     (`"companyId":(\d+)`) — both shapes have been observed in the
 *     wild.
 *   - Step 2 hits `https://join.com/api/public/companies/<id>/jobs`
 *     paginated at `pageSize=50`, `sort=+title`, with
 *     `withAggregations=true`. Polite pacing of `>= 0.5 s` between
 *     pages matches upstream Python's `time.sleep(0.5)` in
 *     `get_all_jobs`.
 *
 * The two regexes live as constants (rather than inline) so a future
 * contributor diffing the upstream Python source can pin them in one
 * place without having to grep through `joincom.service.ts`.
 */

/** Base URL for the public-facing company portal (used by the Step 1 HTML scrape). */
export const JOINCOM_BASE_URL = 'https://join.com';

/** API root for Join.com's public REST surface. */
export const JOINCOM_API_BASE_URL = `${JOINCOM_BASE_URL}/api/public`;

/** Default page size for the paginated jobs API. Matches upstream Python's `page_size=50`. */
export const JOINCOM_PAGE_SIZE = 50;

/** Polite-pacing delay between paginated GETs (seconds). Matches upstream Python's `time.sleep(0.5)`. */
export const JOINCOM_RATE_DELAY_SECONDS = 0.5;

/** Ceiling on jobs returned when `input.resultsWanted` is unset. Matches AvatureService / GemService precedent. */
export const JOINCOM_DEFAULT_RESULTS_WANTED = 100;

/** Hard ceiling on pagination loops to prevent runaway scrapes. */
export const JOINCOM_MAX_PAGES = 100;

/** Default locale for the jobs API call (matches upstream Python's `locale="en-us"`). */
export const JOINCOM_DEFAULT_LOCALE = 'en-us';

/**
 * Headers Join.com expects on the Step 1 HTML scrape (browser-shaped
 * Accept so the server returns the embedded JSON inside an HTML
 * payload — an `application/json` Accept header would 406).
 */
export const JOINCOM_HTML_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Headers for the Step 2 JSON API call. Matches upstream Python's
 * `accept: application/json` — the API returns 406 for any other
 * Accept value.
 */
export const JOINCOM_JSON_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

/**
 * Primary regex extracting the numeric company id from the embedded
 * JSON inside the company HTML page. Format observed in the wild:
 * `..."company":{"id":12345,"name":...}`. The leading `"company":{`
 * disambiguates against any nested `id` field on a co-occurring
 * `companyMember` / `companyTheme` blob.
 */
export const JOINCOM_COMPANY_ID_PRIMARY_REGEX = /"company":\{"id":(\d+)/;

/**
 * Fallback regex when the primary shape isn't present (the company
 * page renders the id as `"companyId":12345` in some skinned tenants).
 * Both shapes have been observed in upstream Python's `get_company_id`
 * so we mirror both here.
 */
export const JOINCOM_COMPANY_ID_FALLBACK_REGEX = /"companyId":(\d+)/;
