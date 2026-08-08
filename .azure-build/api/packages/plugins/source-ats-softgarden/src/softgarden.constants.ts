/**
 * Constants for the Softgarden e-recruiting career-page platform.
 *
 * Softgarden is a German cloud ATS / e-recruiting platform. Each customer
 * tenant operates its own public, branded career page. The modern (React)
 * career page is served from a per-tenant host such as
 * `https://{slug}.career.softgarden.de/` (or a custom domain), and it exposes
 * a fully anonymous, no-auth, schema.org **JobPosting DataFeed** at:
 *
 *   `GET {tenantOrigin}/jobs.feed.json`
 *
 * This is the surface this adapter uses. It is the same machine-readable feed
 * that the career page publishes for search engines / aggregators, so no API
 * key, channel id, or client token is required (unlike the documented
 * authenticated `v2`/`v3` jobboard REST APIs, which need a client/user access
 * token and are explicitly NOT used here).
 *
 * Verified wire shape — `GET {tenantOrigin}/jobs.feed.json`:
 *   HTTP 200, `application/json`. Top-level object:
 *     {
 *       "meta": { "source": "...", "schema": "https://schema.org/JobPosting" },
 *       "@context": "https://schema.org/",
 *       "@type": "DataFeed",
 *       "name": "Active job ads",
 *       "dateModified": "2026-06-03T13:09:58.105Z",
 *       "numberOfItems": 10,
 *       "dataFeedElement": [
 *         {
 *           "@type": "DataFeedItem",
 *           "dateModified": "2026-06-03T03:56:33.000Z",
 *           "item": {
 *             "@type": "JobPosting",
 *             "title": "Key Account Manager ...",
 *             "url": "https://{tenant}/jobs/61985494/Key-Account-Manager-.../",
 *             "datePosted": "2026-05-22T15:33:44.933+02:00",
 *             "identifier": { "@type": "PropertyValue", "name": "<org>", "value": 61985494 },
 *             "description": "<b>Deine Rolle</b>\n<p>...</p>",  // inline HTML
 *             "employmentType": "FULL_TIME",
 *             "hiringOrganization": {
 *               "@type": "Organization", "name": "<org>", "url": "...", "logo": "..."
 *             },
 *             "jobLocation": {
 *               "@type": "Place",
 *               "address": {
 *                 "@type": "PostalAddress",
 *                 "addressLocality": "Berlin",
 *                 "addressRegion": "Berlin",
 *                 "postalCode": "10789",
 *                 "addressCountry": "DE",
 *                 "streetAddress": "..."
 *               }
 *             }
 *           }
 *         }
 *       ]
 *     }
 *
 * Key wire facts (verified live 2026-06-03 against
 * `softgarden.career.softgarden.de`, HTTP 200, `numberOfItems: 10`):
 *   - The full job HTML description is embedded inline in `item.description`,
 *     so NO per-job detail fan-out is required.
 *   - `item.identifier.value` (numeric) is the stable ATS id; it also appears
 *     as the first path segment of `item.url` (`/jobs/{id}/{slug}/`).
 *   - `item.url` is the canonical, anonymous public job-detail page (HTTP 200).
 *   - `item.jobLocation.address` carries structured city/region/country.
 *   - `item.employmentType` is a schema.org token (FULL_TIME, PART_TIME,
 *     CONTRACTOR, TEMPORARY, INTERN, ...) — used as the department fallback.
 *   - An unknown tenant / a tenant on the legacy (non-React) board returns
 *     HTTP 404 (text/html) for `/jobs.feed.json` — degrade to empty, no throw.
 *
 * Tenant resolution: a `companySlug` is mapped to
 * `https://{slug}.career.softgarden.de`; a `companyUrl` is used by its origin
 * verbatim (supporting custom domains and `*.softgarden.io` / `*.softgarden.de`
 * hosts).
 */

/** Shared apex for Softgarden-hosted modern (React) career pages. */
export const SOFTGARDEN_CAREER_APEX = 'career.softgarden.de';

/** Host template for a slug-addressed Softgarden career page; `{slug}` is substituted. */
export const SOFTGARDEN_HOST_TEMPLATE = 'https://{slug}.career.softgarden.de';

/** Anonymous schema.org JobPosting DataFeed path (appended to the tenant origin). */
export const SOFTGARDEN_FEED_PATH = '/jobs.feed.json';

/** Public job-detail page path template; `{id}` is the numeric job identifier. */
export const SOFTGARDEN_JOB_PAGE_TEMPLATE = '/jobs/{id}/';

/**
 * Default internal results cap. When a caller omits `resultsWanted` entirely
 * we ingest up to 100 of the tenant's open roles. The feed itself returns the
 * tenant's full active set in a single document, so we slice client-side.
 */
export const SOFTGARDEN_DEFAULT_RESULTS = 100;

/** Default request headers. The feed is plain anonymous JSON; no special headers needed. */
export const SOFTGARDEN_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
};
