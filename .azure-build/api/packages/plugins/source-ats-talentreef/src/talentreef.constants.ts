/**
 * Constants for the TalentReef (Mitratech) hourly-hiring careers platform.
 *
 * TalentReef (talentreef.com, a Mitratech product) is a US, high-volume /
 * hourly-workforce ATS (QSR, retail, hospitality, grocery). Every customer
 * tenant publishes a branded, public, unauthenticated career-search site on the
 * shared TalentReef "Job Application Network" host:
 *
 *   https://apply.jobappnetwork.com/{tenant}/{lang}
 *     e.g. https://apply.jobappnetwork.com/rtg/en           (Rooms To Go)
 *          https://apply.jobappnetwork.com/jibinc/en        (Jack in the Box)
 *          https://apply.jobappnetwork.com/mcm/en           (Metz Culinary)
 *          https://apply.jobappnetwork.com/surf-sand-careers/en
 *
 * The career-search page is a client-rendered single-page app whose open roles
 * are populated from an embedded positions payload + per-posting schema.org
 * `JobPosting` JSON-LD markup. Each tenant's full open-roles list is served in
 * one document (the SPA filters client-side via query params such as
 * `?category=…&state=…&keywordsFilter=…`), so the adapter fetches once and
 * slices client-side to honour `resultsWanted`.
 *
 * The legacy server-rendered applicant portal lives on a sibling host
 * (`https://{secure|cf-apply}.jobappnetwork.com/apply/c_{code}/l_{lang}/`) and
 * is the application/onboarding surface, not the public job-listing surface; the
 * adapter targets the `apply.jobappnetwork.com/{tenant}` career-search surface.
 *
 * The tenant is addressed by a human-friendly `{tenant}` slug (the path segment
 * on `apply.jobappnetwork.com`, e.g. `rtg`, `jibinc`, `surf-sand-careers`). When
 * a caller supplies a `companyUrl`, the adapter extracts that slug from the
 * URL's leading path segment (or sub-domain for portal-style URLs).
 *
 * An unknown tenant (HTTP 404 / 4xx) or a malformed payload degrades to an empty
 * (graceful) result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * Live-verification note (2026-06-03): the public career-search pages
 * (`apply.jobappnetwork.com/{tenant}/en`) are confirmed live and unauthenticated
 * for multiple real tenants (`rtg`, `jibinc`, `mcm`, `surf-sand-careers`,
 * `tacobellcorporate`). They are JavaScript-rendered SPAs, so the exact byte
 * shape of the embedded positions JSON / JSON-LD could NOT be byte-confirmed via
 * a plain HTTP fetch (the host's `api.jobappnetwork.com` JSON endpoint returns
 * HTTP 401 without a key). The wire types here are therefore modelled
 * defensively against the public schema.org `JobPosting` contract plus the
 * SPA's embedded positions array, and the adapter degrades gracefully when a
 * field or the whole payload is absent. See spec.md (Risks / Open Questions).
 */

/** Shared public TalentReef career-search host that fronts every tenant. */
export const TALENTREEF_HOST = 'https://apply.jobappnetwork.com';

/**
 * Public, unauthenticated tenant career-search page. `{tenant}` is the
 * human-friendly slug (the path segment, e.g. `rtg`); `{lang}` is the language
 * code (defaults to `en`).
 */
export const TALENTREEF_CAREERS_PATH_TEMPLATE = '/{tenant}/{lang}';

/** Default language segment used when a caller does not provide one. */
export const TALENTREEF_DEFAULT_LANG = 'en';

/**
 * Matches an embedded positions / API reference in a tenant career page,
 * capturing the numeric internal client id (e.g.
 * `apply.jobappnetwork.com/clients/21993/`). Modelled defensively — used only
 * as a secondary hint; the primary key is the human-friendly tenant slug.
 */
export const TALENTREEF_CLIENT_ID_REGEX = /jobappnetwork\.com\/clients\/(\d{2,})/;

/**
 * Matches per-posting schema.org `JobPosting` JSON-LD blocks embedded in the
 * tenant career page HTML. Each match's capture group is a single JSON object
 * we parse defensively. Multiline / dot-all matching is applied at call sites.
 */
export const TALENTREEF_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Matches an embedded positions/state bootstrap blob the SPA hydrates from
 * (e.g. `window.__INITIAL_STATE__ = {…};`). Captured group is the JSON literal.
 */
export const TALENTREEF_STATE_REGEX =
  /window\.__(?:INITIAL_STATE|NEXT_DATA|PRELOADED_STATE)__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/i;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const TALENTREEF_DEFAULT_RESULTS = 100;

/** Default request headers. A browser-like UA + HTML/JSON accept. */
export const TALENTREEF_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/json,application/xhtml+xml,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
