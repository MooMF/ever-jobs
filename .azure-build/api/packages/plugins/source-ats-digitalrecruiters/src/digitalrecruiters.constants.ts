/**
 * Constants for the DigitalRecruiters multi-tenant career-site platform.
 *
 * DigitalRecruiters (digitalrecruiters.com) is a French ATS + CRM + career-site
 * platform used by multi-site / multi-brand / international employers. Each
 * customer tenant gets a public, server-rendered career site at
 * `https://{tenant}.digitalrecruiters.com/` (Nuxt SPA), and many tenants also
 * map a custom career domain (e.g. `careers.segulatechnologies.com`).
 *
 * The career-site SPA renders its job listing entirely from two anonymous,
 * unauthenticated JSON endpoints on a shared public API host. The wire surface
 * below was reverse-engineered from the SPA bundle and byte-confirmed against
 * live tenants on 2026-06-03.
 *
 * ── Verified wire surface (2026-06-03) ────────────────────────────────────
 *
 *   API host:  `https://api.digitalrecruiters.com`
 *
 *   1. **Careers-site config** (resolves the canonical career domain + locale)
 *      `GET /careers/v1/careers-sites/{host}`
 *        where `{host}` may be EITHER the `{tenant}.digitalrecruiters.com`
 *        sub-domain OR a mapped custom domain. Returns HTTP 200:
 *        `{ internal_id, domain_name, is_online, available_locales: [{iso_code,title}],
 *           default_locale: {iso_code,title}, child_account_name, name, ... }`
 *        `domain_name` is the canonical career domain that the job-ads
 *        endpoint expects as its `domainName` parameter.
 *
 *   2. **Job-ad listing** (the primary listing surface)
 *      `POST /public/v1/careers-site/job-ads?domainName={domain}&limit={n}&page={p}&locale={loc}`
 *        Body: a JSON filter object — `{}` (empty) returns the unfiltered list.
 *        Returns HTTP 200:
 *        `{ count: <total>, items: [ {
 *             id: "{job_ad_id}-{address_id}", job_ad_id: <number>, title,
 *             contract, location, job, url: "{job_ad_id}-{slug}", image, image_wide,
 *             brand_id, is_external, is_aggregated, career_domain, ...
 *           } ] }`
 *        `count` is the tenant's total open-role count; pagination is 1-based
 *        via `page` + `limit`. The listing row has NO description — a per-job
 *        detail fetch is needed for the body.
 *
 *   3. **Job-ad detail** (one role; provides the HTML description + structured address)
 *      `GET /public/v1/careers-site/job-ads/{job_ad_id}?domainName={domain}&locale={loc}&withJsonld=1`
 *        Note: the detail path takes the NUMERIC `job_ad_id`, not the composite
 *        `id`. Returns HTTP 200:
 *        `{ id, job_ad_id, title, description: "<html>", profile: "<html>",
 *           contract, working_time, republished_at, education_level, job_experience,
 *           address: { id, street, zip, city, state, country, location:{lat,lng} },
 *           formatted_address, brand_name, apply_email, is_external,
 *           jsonld: { datePosted, employmentType, jobLocation, ... }, ... }`
 *        `description` and `profile` are HTML fragments; `jsonld.datePosted`
 *        is an ISO `YYYY-MM-DD` string.
 *
 *   **Locale handling:** the listing/detail endpoints require a region-qualified
 *   locale code (e.g. `en_GB`, `fr_FR`) — a bare two-letter `iso_code` such as
 *   `en` is rejected with HTTP 400 `"This locale isn't supported"`. The config's
 *   `available_locales[].iso_code` / `default_locale.iso_code` are bare codes
 *   (and a few already region-qualified, e.g. `pt_BR`, `zh_CN`). We expand bare
 *   codes via {@link DIGITALRECRUITERS_LOCALE_MAP} (the same table the SPA uses).
 *
 *   **Public job-detail page URL:** `https://{tenant}.digitalrecruiters.com/{lang}/annonce/{job_ad_id}-{slug}`
 *   where `{lang}` is the two-letter language label and `{slug}` is the listing
 *   row's `url` (already prefixed with the `job_ad_id`).
 *
 * Verified live on 2026-06-03 against:
 *   - `careers.segulatechnologies.com` (tenant `segulatechnologies-careers`):
 *     config HTTP 200 (`domain_name=careers.segulatechnologies.com`,
 *     `internal_id=dRjVLJRz`); listing HTTP 200 (`count=683`); detail HTTP 200
 *     (job_ad_id 4428717, HTML description + jsonld.datePosted=2026-06-03).
 *   - `recrutement.la-boucherie.fr`: listing HTTP 200 (`count=58`).
 */

/** Public API host for every DigitalRecruiters tenant. */
export const DIGITALRECRUITERS_API_HOST = 'https://api.digitalrecruiters.com';

/** Shared apex for DigitalRecruiters-hosted tenant sub-domains. */
export const DIGITALRECRUITERS_APEX = 'digitalrecruiters.com';

/** Host template for DigitalRecruiters-hosted tenants; `{tenant}` substituted at runtime. */
export const DIGITALRECRUITERS_HOST_TEMPLATE = 'https://{tenant}.digitalrecruiters.com';

/**
 * Careers-site config path (appended to the API host). `{host}` is the tenant
 * sub-domain host or a custom career domain. Resolves the canonical `domain_name`
 * and the default locale that the job-ads endpoint expects.
 */
export const DIGITALRECRUITERS_SITE_CONFIG_PATH = '/careers/v1/careers-sites/{host}';

/** Anonymous job-ad listing path (POST; appended to the API host). */
export const DIGITALRECRUITERS_JOB_LIST_PATH = '/public/v1/careers-site/job-ads';

/** Anonymous job-ad detail path (GET; `{id}` = numeric `job_ad_id`). */
export const DIGITALRECRUITERS_JOB_DETAIL_PATH = '/public/v1/careers-site/job-ads/{id}';

/** Public job-detail page URL template. */
export const DIGITALRECRUITERS_JOB_PAGE_TEMPLATE =
  'https://{tenant}.digitalrecruiters.com/{lang}/annonce/{slug}';

/** Server-side page size requested per listing call. */
export const DIGITALRECRUITERS_PAGE_SIZE = 50;

/** Maximum number of detail-fetch calls issued concurrently per pagination round. */
export const DIGITALRECRUITERS_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential pagination rounds, to stay polite. */
export const DIGITALRECRUITERS_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. When a caller omits `resultsWanted` we ingest
 * up to 100 of the tenant's open roles.
 */
export const DIGITALRECRUITERS_DEFAULT_RESULTS = 100;

/** Fallback region-qualified locale used when no config locale can be resolved. */
export const DIGITALRECRUITERS_DEFAULT_LOCALE = 'en_GB';

/** Fallback two-letter language label used in the public job-page URL. */
export const DIGITALRECRUITERS_DEFAULT_LANG = 'en';

/**
 * Locale expansion table: bare `iso_code` → region-qualified locale accepted by
 * the job-ads endpoints. Mirrors the mapping shipped in the career-site SPA.
 * Codes already region-qualified (e.g. `pt_BR`, `zh_CN`, `de_CH`) pass through.
 */
export const DIGITALRECRUITERS_LOCALE_MAP: Record<string, string> = {
  cs: 'cs_CZ',
  da: 'da_DK',
  de: 'de_DE',
  de_CH: 'de_CH',
  en: 'en_GB',
  es: 'es_ES',
  fr: 'fr_FR',
  fr_CA: 'fr_CA',
  fr_CH: 'fr_CH',
  it: 'it_IT',
  it_CH: 'it_CH',
  ja: 'ja_JP',
  ko: 'ko_KR',
  nl: 'nl_BE',
  pl: 'pl_PL',
  pt: 'pt_PT',
  pt_BR: 'pt_BR',
  ro: 'ro_RO',
  sv: 'sv_SE',
  tr: 'tr_TR',
  zh_CN: 'zh_CN',
  zh_HK: 'zh_HK',
};

/** Default request headers. The public API accepts plain JSON with no special headers. */
export const DIGITALRECRUITERS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
