/**
 * Constants for the Traffit applicant-tracking careers platform.
 *
 * Traffit (traffit.com) is a Poland / EU-focused recruitment ATS. Every customer
 * tenant runs a branded careers page served from its own sub-domain
 * (`https://{tenant}.traffit.com`). Traffit exposes a **public, anonymous,
 * unauthenticated** "Public API" — free and available on every plan — that
 * returns the tenant's currently published job adverts:
 *
 *   GET https://{tenant}.traffit.com/public/job_posts/published
 *     → [
 *         {
 *           url: "https://{tenant}.traffit.com/public/an/{token}?source=career_page",
 *           id: 639,                       // public job-post id (the ATS id)
 *           valid_start: "2026-06-03 15:58:21",
 *           awarded: false,
 *           options: { ... },
 *           huntoo_link: null,
 *           application_form: "https://{tenant}.traffit.com/public/form/a/{token}?source=career_page",
 *           advert: {
 *             id: 12345,
 *             name: "Customer Support Specialist",   // job title
 *             language: "pl",
 *             recruitment: { workflow_id, id, nr_ref: "1/6/2026/AW/817" },
 *             values: [
 *               { field_id: "description",  value: "<p>…HTML…</p>" },
 *               { field_id: "geolocation",  value: { country, iso, locality, region1, region2, region3, latitude, longitude } }
 *             ]
 *           }
 *         },
 *         …
 *       ]
 *
 * The tenant is addressed by its sub-domain label (the `companySlug`, e.g.
 * `people` → `people.traffit.com`); a fully-qualified `companyUrl` is also
 * accepted and its first sub-domain label is used. The feed returns every
 * published advert for the tenant in one array (no server-side pagination), so
 * we fetch once and slice client-side to honour `resultsWanted`.
 *
 * An unknown tenant resolves to a non-existent sub-domain (DNS / HTTP error) or
 * yields an HTTP 4xx; either is treated as an empty (graceful) result rather
 * than an error. Verified live 2026-06-03 against `people.traffit.com`
 * (12 published adverts) and `traffit.traffit.com`.
 */

/** Host template for a Traffit tenant careers sub-domain. */
export const TRAFFIT_HOST_TEMPLATE = 'https://{tenant}.traffit.com';

/** Apex domain shared by every hosted Traffit tenant sub-domain. */
export const TRAFFIT_BASE_DOMAIN = 'traffit.com';

/**
 * Public, unauthenticated published-adverts feed path. Appended to the resolved
 * tenant host (`https://{tenant}.traffit.com`).
 */
export const TRAFFIT_PUBLISHED_PATH = '/public/job_posts/published';

/** `advert.values[].field_id` carrying the HTML job description body. */
export const TRAFFIT_FIELD_DESCRIPTION = 'description';

/** `advert.values[].field_id` carrying the structured geolocation object. */
export const TRAFFIT_FIELD_GEOLOCATION = 'geolocation';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's published adverts.
 */
export const TRAFFIT_DEFAULT_RESULTS = 100;

/** Default request headers. The feed expects a browser-like UA + JSON accept. */
export const TRAFFIT_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
