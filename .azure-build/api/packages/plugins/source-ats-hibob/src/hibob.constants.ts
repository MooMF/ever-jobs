/**
 * Constants for the HiBob ("Bob", hibob.com) HR / hiring platform careers surface.
 *
 * HiBob is an HR platform whose Hiring module lets each customer publish a branded,
 * public, unauthenticated careers page. Every customer tenant is addressed by its
 * company slug on the shared careers host:
 *
 *   https://{tenant}.careers.hibob.com/jobs
 *
 * (e.g. the named real tenants `hibob-e360.careers.hibob.com` and
 * `dcbyte.careers.hibob.com`). An individual role lives at
 * `https://{tenant}.careers.hibob.com/jobs/{jobId}` and its application form at
 * `https://{tenant}.careers.hibob.com/jobs/{jobId}/apply`, where `{jobId}` is an
 * opaque UUID. The careers page itself is a client-rendered SPA, so the listing
 * page carries no server-side job links; the stable public surface is the
 * documented, anonymous **Hiring API** on `api.hibob.com` that the SPA consumes:
 *
 *  1. The active-job-ads list (all roles promoted on the tenant's careers page):
 *
 *       POST https://api.hibob.com/v1/hiring/job-ads/search
 *         body: { "filters": [], "fields": [] }   // empty filters → all active ads
 *         → { "jobAds": [
 *               { "jobAd": { "id": "1fde23e9-…", "title": "Senior Engineer",
 *                            "description": "<html body>", "location": "London, UK",
 *                            "department": "Engineering", "employmentType": "Full-time",
 *                            "remote": true, "applyUrl": "https://{tenant}.careers.hibob.com/jobs/{id}/apply",
 *                            "url": "https://{tenant}.careers.hibob.com/jobs/{id}",
 *                            "createdAt": "2024-01-12T…" } }, … ] }
 *
 *  2. The per-role detail object (full body + metadata):
 *
 *       GET https://api.hibob.com/v1/hiring/job-ads/{id}
 *         → { "jobAd": { …same shape as a list entry… } }
 *
 * The Hiring API documents that "the service user you use with the Hiring API
 * endpoints doesn't require any permission to retrieve Job Ads", and the
 * `jobAd/applyUrl` field is the canonical public apply link. An unknown tenant /
 * missing board degrades naturally to an empty result; a fetch error, an HTTP 4xx,
 * a malformed body, or a single bad role degrades to an empty / partial result
 * rather than throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication):
 *  - Confirmed live: the platform + tenant addressing
 *    (`{tenant}.careers.hibob.com/jobs`, per-role `/jobs/{id}`, apply
 *    `/jobs/{id}/apply`) and real, named tenants on it (`hibob-e360`, `dcbyte`).
 *  - Confirmed from the public Hiring API docs: the anonymous job-ads endpoints
 *    `POST /v1/hiring/job-ads/search` (active careers-page ads) and
 *    `GET /v1/hiring/job-ads/{id}`, and that the `jobAd/applyUrl` field carries the
 *    public apply link.
 *  - NOT confirmed byte-level: the careers SPA is client-rendered and the docs
 *    portal (apidocs.hibob.com) gates the full request/response schema (HTTP 403),
 *    so the exact tenant-identification mechanism and field envelope could not be
 *    observed on the wire. This adapter is therefore a DEFENSIVE design
 *    (verified=false): every field is optional + defensively narrowed, the careers
 *    portal is also the primary URL source (the API call is best-effort), and any
 *    error degrades gracefully to an empty / partial result.
 */

/** Public, unauthenticated Hiring API origin backing the careers job board. */
export const HIBOB_API_BASE = 'https://api.hibob.com';

/** Shared careers-portal root domain (candidate-facing SPA, `{tenant}.careers.hibob.com`). */
export const HIBOB_CAREERS_DOMAIN = 'careers.hibob.com';

/** Root platform domain — used to recognise tenant hosts passed via `companyUrl`. */
export const HIBOB_ROOT_DOMAIN = 'hibob.com';

/** Public active-job-ads search endpoint (all roles promoted on a tenant's careers page). */
export const HIBOB_JOB_ADS_SEARCH_PATH = '/v1/hiring/job-ads/search';

/** Public per-role detail endpoint (`/v1/hiring/job-ads/{id}`). */
export const HIBOB_JOB_ADS_PATH = '/v1/hiring/job-ads';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's active roles.
 */
export const HIBOB_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on list pages walked per scrape, so a pathological pagination chain
 * (or a very large tenant with a high `resultsWanted`) can never spin unbounded.
 * The job-ads search returns all active ads in a single response, so this is a
 * defensive cap should a future cursor-paginated variant appear.
 */
export const HIBOB_MAX_PAGES = 50;

/** Default request headers. The API expects a browser-like UA + JSON Accept. */
export const HIBOB_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Detects remote / home-working roles across the title, location, and workplace fields. */
export const HIBOB_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
