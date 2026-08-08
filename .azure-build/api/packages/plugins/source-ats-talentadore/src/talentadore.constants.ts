/**
 * Constants for the TalentAdore applicant-tracking careers platform.
 *
 * TalentAdore (talentadore.com) is a Finnish, human-centered recruitment / ATS
 * platform ("TalentAdore Hire"). Every customer tenant publishes a branded,
 * WordPress-multisite career page on its own sub-domain
 * (`https://{tenant}.careers.talentadore.com/`, or a custom vanity domain), and
 * the open roles are pulled from one shared, public, unauthenticated JSON feed
 * served from the TalentAdore ATS host:
 *
 *   GET https://ats.talentadore.com/positions/{feedKey}/json
 *         ?v=2&display_description=job_description
 *     → {
 *         "version": "1.0",
 *         "company": "Amer Sports",
 *         "generated_at": "2026-06-03T14:19:19.512112Z",
 *         "jobs": [ { id, job_token, name, link, description_html,
 *                     description_text, updated, start_date, due_date,
 *                     location, county, country, city, tags, categories,
 *                     employment_type, business_unit_name, ... }, ... ]
 *       }
 *
 * The tenant is addressed by a `{feedKey}` — a short opaque token (e.g.
 * `mwRcjSn`) issued by TalentAdore's RSS/JSON "feed builder" (Positions →
 * RSS feed). It is the tenant's public read key for the open-roles feed; the
 * matching RSS view simply swaps `/json` for `/rss`. The feed key is NOT the
 * sub-domain label, so when a caller supplies a human-friendly `companySlug`
 * (the careers sub-domain, e.g. `amersports`) or a `companyUrl`, the adapter
 * first loads that career page and harvests the embedded
 * `ats.talentadore.com/positions/{feedKey}` reference, then fetches the feed.
 * A caller may also pass the opaque feed key directly as `companySlug`.
 *
 * The endpoint returns every open role for the tenant in one response (no
 * server-side pagination), so we slice client-side to honour `resultsWanted`.
 * An unknown sub-domain / feed key (HTTP 404 / 4xx) or a malformed payload
 * degrades to an empty (graceful) result rather than throwing, so a single bad
 * tenant never breaks a batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `https://amersports.careers.talentadore.com/` → HTML embedding
 *    `ats.talentadore.com/positions/mwRcjSn/json` (Amer Sports, 36 open roles).
 *  - `GET https://ats.talentadore.com/positions/mwRcjSn/json?v=2&display_description=job_description`
 *    → HTTP 200 JSON envelope with the 36-role `jobs[]` array.
 *  - Empty-tenant feeds (e.g. Beamex `nyNS3Sd`) return HTTP 200 with `jobs: []`.
 */

/** Shared public ATS host that serves every tenant's open-roles JSON feed. */
export const TALENTADORE_ATS_HOST = 'https://ats.talentadore.com';

/**
 * Public, unauthenticated positions feed path. `{feedKey}` is the tenant's
 * feed-builder token (its public read key for the open-roles feed).
 */
export const TALENTADORE_FEED_PATH_TEMPLATE = '/positions/{feedKey}/json';

/**
 * Default query string for the JSON feed. `v=2` selects the current schema and
 * `display_description=job_description` asks the feed to inline the full job-ad
 * body (`description_html` / `description_text`).
 */
export const TALENTADORE_FEED_QUERY = 'v=2&display_description=job_description';

/** Canonical tenant career-page host template (WordPress multisite sub-domain). */
export const TALENTADORE_CAREERS_HOST_TEMPLATE = 'https://{tenant}.careers.talentadore.com/';

/**
 * Matches the embedded `ats.talentadore.com/positions/{feedKey}` reference in a
 * tenant career page's HTML, capturing the opaque feed key. The key is
 * URL-safe (alphanumerics plus `-`/`_`) and short (≥ 5 chars).
 */
export const TALENTADORE_FEED_KEY_REGEX = /ats\.talentadore\.com\/positions\/([A-Za-z0-9_-]{5,})/;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const TALENTADORE_DEFAULT_RESULTS = 100;

/** Default request headers. The feed expects a browser-like UA + JSON accept. */
export const TALENTADORE_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
