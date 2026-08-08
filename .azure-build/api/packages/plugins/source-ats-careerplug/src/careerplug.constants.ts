/**
 * Constants for the CareerPlug applicant-tracking careers platform.
 *
 * CareerPlug (careerplug.com) is a USA-based SMB / franchise-focused ATS used by
 * 60,000+ businesses. Every customer tenant publishes a branded, public,
 * anonymous careers site on its own sub-domain:
 *
 *   https://{tenant}.careerplug.com/
 *
 * No anonymous JSON / XML feed is exposed for a tenant. The public surface is
 * server-rendered HTML, but CareerPlug embeds a complete `schema.org`
 * `ItemList` of `JobPosting` objects as `application/ld+json` on the careers
 * landing page and on the `/jobs` index — this structured block is the primary,
 * stable data source for this adapter:
 *
 *   GET https://{tenant}.careerplug.com/jobs
 *     → HTML embedding:
 *         <script type="application/ld+json">
 *         {
 *           "@context": "https://schema.org",
 *           "@type": "ItemList",
 *           "numberOfItems": N,
 *           "itemListElement": [
 *             { "@type": "ListItem", "position": 1, "item": {
 *                 "@type": "JobPosting",
 *                 "title": "Sales Account Executive",
 *                 "description": "…(full HTML/plain body)…",
 *                 "datePosted": "2025-06-02T12:34:07+00:00",
 *                 "employmentType": "FULL_TIME",
 *                 "directApply": true,
 *                 "hiringOrganization": { "@type": "Organization",
 *                     "name": "CareerPlug", "sameAs": "https://www.careerplug.com" },
 *                 "jobLocationType": "TELECOMMUTE",
 *                 "applicationLocationRequirement": { "@type": "Country", "name": "USA" },
 *                 "baseSalary": { "@type": "MonetaryAmount", "currency": "USD",
 *                     "value": { "@type": "QuantitativeValue", "unitText": "YEAR", "value": "50000.00" } }
 *             } }
 *           ]
 *         }
 *         </script>
 *
 * The JSON-LD `JobPosting` items carry no per-item URL or identifier, so the
 * adapter pairs them, in document order, with the page's job-card anchors
 * (`/jobs/{id}` detail links, or `/j/{shortcode}` short links) to recover each
 * role's public URL and numeric ATS id. When no anchor is available the ATS id
 * is derived deterministically from the role title + list position so the run
 * still emits stable, de-dupable jobs.
 *
 * A single-job tenant's `/jobs` index 302-redirects straight to the role's
 * application page (`/jobs/{id}/apps/new`); the careers landing page (the
 * sub-domain root, which resolves to `/account`) still carries the full
 * `ItemList` JSON-LD, so the adapter falls back to it when the `/jobs` fetch
 * yields no JobPosting items.
 *
 * An unknown / dead tenant sub-domain returns an HTTP redirect to the CareerPlug
 * sign-in app (or an HTTP 4xx), which this adapter treats as an empty (graceful)
 * result rather than an error.
 */

/** Host template for a tenant's public CareerPlug careers site. */
export const CAREERPLUG_HOST_TEMPLATE = 'https://{tenant}.careerplug.com';

/** Apex domain shared by every CareerPlug tenant sub-domain. */
export const CAREERPLUG_BASE_DOMAIN = 'careerplug.com';

/** Public, unauthenticated open-roles index path for a tenant. */
export const CAREERPLUG_JOBS_PATH = '/jobs';

/**
 * Careers landing-page path (the sub-domain root resolves here). Used as a
 * fallback list source when the `/jobs` index 302-redirects to a single role's
 * application page (single-job tenants).
 */
export const CAREERPLUG_LANDING_PATH = '/account';

/** Detail-page path template for a single role (`/jobs/{id}`). */
export const CAREERPLUG_JOB_DETAIL_PATH_TEMPLATE = '/jobs/{id}';

/**
 * Matches a numeric job id in a CareerPlug detail / application URL, e.g.
 * `/jobs/2980175`, `/jobs/2980175/apps/new`.
 */
export const CAREERPLUG_JOB_ID_REGEX = /\/jobs\/(\d+)/i;

/**
 * Matches a CareerPlug short job link, e.g. `/j/02nmdcu`. The captured token is
 * an opaque per-role short code used as a fallback ATS id when no numeric id is
 * present on the listing.
 */
export const CAREERPLUG_SHORT_LINK_REGEX = /\/j\/([A-Za-z0-9]+)/i;

/** CSS selector for every `application/ld+json` block on a page. */
export const CAREERPLUG_LD_JSON_SELECTOR = 'script[type="application/ld+json"]';

/** Detail-page selector: the visible role title. */
export const CAREERPLUG_JOB_NAME_SELECTOR = '.job-name';

/** Detail-page selector: the visible free-text location chip. */
export const CAREERPLUG_JOB_LOCATION_SELECTOR = '.job-location';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const CAREERPLUG_DEFAULT_RESULTS = 100;

/** Default request headers. The careers site expects a browser-like UA. */
export const CAREERPLUG_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
