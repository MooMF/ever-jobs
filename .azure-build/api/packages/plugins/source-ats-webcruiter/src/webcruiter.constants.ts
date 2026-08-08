/**
 * Constants for the Webcruiter applicant-tracking careers platform.
 *
 * Webcruiter (webcruiter.com) is a Norwegian / Nordic ATS operated by Talentech.
 * Every customer (a Norwegian municipality, hospital trust, NGO, etc.) publishes
 * its open roles through one shared public candidate portal at
 * `candidate.webcruiter.com`. Each tenant is addressed by a numeric "company
 * lock" id — the value seen on the public portal as the `companyLock` query
 * parameter (e.g. `https://candidate.webcruiter.com/en-gb/home/companyadverts?companyLock=23109900`).
 *
 * The portal is a single-page app that hydrates from two public, unauthenticated
 * JSON endpoints on the same host:
 *
 *   1. Company metadata (display name, logo, flags):
 *      GET https://candidate.webcruiter.com/api/company/companymeta/{companyLock}?language={lang}
 *        → { TenantId, CompanyId, CompanyName, CompanyLogoLibUrl, ShowAdvertSearch, ... }
 *
 *   2. Advert (open-roles) search — the job list:
 *      POST https://candidate.webcruiter.com/api/odvert/companysearch/{companyLock}?language={lang}
 *        body: { "take": <n>, "skip": <n> }     // JSON; paging only
 *        → {
 *            Total: <number>,                    // total open roles for the tenant
 *            Data: [ {                            // one entry per advert (this page)
 *              Id, TenantId, CompanyName, Heading, JobType, JobCategory,
 *              Presentation, PublishedDate ("DD.MM.YYYY"),
 *              ApplicationDeadline (ISO-8601), ApplyWithinDate ("DD.MM.YYYY"),
 *              Workplace / Workplace2 / Workplace3, WorkPlaceFacet,
 *              MultipleWorkplaces, Language, Culture, PictureUrl,
 *              OpenAdvertUrl ("https://{companyLock}.webcruiter.no/Main/Recruit/Public/{Id}?language=..."),
 *              ApplyUrl ("/{culture}/cv?advertId={Id}&...")
 *            } ],
 *            Facets: { ... },                     // category/workplace facets — not job data
 *            Aggregates: null
 *          }
 *
 * Both endpoints require no auth, cookie, or API key. The search endpoint is
 * POST-only (a GET returns HTTP 405). An empty body returns `Data: []` with a
 * correct `Total`, so a `{ take, skip }` body is required to receive rows. An
 * unknown / dead company lock returns HTTP 200 with `{ Total: 0, Data: [] }`
 * rather than an error, which we treat as an empty (graceful) result.
 *
 * Public job-detail pages live on a per-tenant sub-domain of `webcruiter.no`
 * (`https://{companyLock}.webcruiter.no/Main/Recruit/Public/{Id}`); the feed
 * supplies this absolute URL directly as `OpenAdvertUrl`, so we never construct
 * it ourselves.
 *
 * Verified live 2026-06-03 against company locks `77790000` (Tromsø kommune, 65
 * open roles) and `23109900` (Norwegian Refugee Council, 13 open roles, English).
 */

/** Shared public candidate-portal host for every Webcruiter tenant. */
export const WEBCRUITER_HOST = 'https://candidate.webcruiter.com';

/**
 * Public, unauthenticated advert-search path (the job list). `{companyLock}` is
 * the tenant's numeric company-lock id. POST-only; body carries paging only.
 */
export const WEBCRUITER_ADVERT_SEARCH_PATH_TEMPLATE = '/api/odvert/companysearch/{companyLock}';

/**
 * Public, unauthenticated company-metadata path (display name, logo). Used to
 * derive a clean `companyName`; falls back to the advert payload / company lock.
 */
export const WEBCRUITER_COMPANY_META_PATH_TEMPLATE = '/api/company/companymeta/{companyLock}';

/**
 * Default UI / advert language passed to both endpoints. Controls which language
 * variant of an advert is returned (Webcruiter adverts are localized per market).
 */
export const WEBCRUITER_DEFAULT_LANGUAGE = 'en';

/**
 * Fallback public job-detail base. The feed normally supplies an absolute
 * `OpenAdvertUrl`; if it is missing we build `https://{companyLock}.webcruiter.no
 * /Main/Recruit/Public/{Id}` from this template.
 */
export const WEBCRUITER_PUBLIC_ADVERT_BASE_TEMPLATE =
  'https://{companyLock}.webcruiter.no/Main/Recruit/Public/{advertId}';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const WEBCRUITER_DEFAULT_RESULTS = 100;

/** Default request headers. The endpoints expect a browser-like UA + JSON. */
export const WEBCRUITER_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
