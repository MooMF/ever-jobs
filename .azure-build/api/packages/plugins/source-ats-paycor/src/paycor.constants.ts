/**
 * Constants for the Paycor Recruiting (formerly Newton Software) applicant-tracking
 * careers platform.
 *
 * Paycor Recruiting (paycor.com — the ATS acquired from Newton Software in 2015) is
 * a US SMB/mid-market ATS. Every customer tenant publishes a branded, public career
 * portal addressed by an opaque per-tenant `clientId` token. The legacy Newton host
 * (`newton.newtonsoftware.com`) now issues a 308 permanent redirect to the canonical
 * Paycor recruiting host (`recruitingbypaycor.com`), which serves the same
 * `clientId`-addressed portal:
 *
 *   https://recruitingbypaycor.com/career/CareerHome.action?clientId={clientId}
 *
 * The portal is server-rendered HTML (no schema.org / JSON-LD markup), and is public
 * and unauthenticated. The career home lists every currently open role as an anchor
 * to the role's detail page:
 *
 *   <a href="…/career/JobIntroduction.action?clientId={clientId}&id={jobId}&source=&lang=en">
 *     {Job Title}
 *   </a>
 *
 * Each `JobIntroduction.action?clientId={clientId}&id={jobId}` detail page is the
 * stable public role URL: the opaque hex `id` is the per-role ATS id. The detail
 * page renders the job title, a "{City}, {State|Country}" location line, an optional
 * department, and the job body under headings ("Job Summary", "Duties and Core
 * Responsibilities", etc.). We enumerate the open roles from the career home in a
 * single fetch (the home lists every open role — there is no server-side pagination
 * of the job set), then fetch each detail page to enrich location / department /
 * body, slicing client-side to honour `resultsWanted`.
 *
 * The caller addresses a tenant by `companySlug` (the opaque `clientId` token) or by
 * a full `companyUrl` (any `recruitingbypaycor.com` / `newtonsoftware.com` career URL
 * carrying a `clientId` query param, from which the token is extracted). An unknown
 * `clientId`, a network error, or a malformed / non-HTML payload degrades to an empty
 * (graceful) result rather than throwing, so a single bad tenant never breaks a batch
 * run.
 *
 * NOTE on the official APIs: Paycor Recruiting ships first-class authenticated REST
 * APIs (and a partner job-distribution feed) for tenants and integrators, but those
 * are token-gated and therefore unsuitable for a generic, tenant-agnostic,
 * unauthenticated scraper. The public career portal is the documented, no-auth
 * surface used here.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `GET https://newton.newtonsoftware.com/career/CareerHome.action?clientId=8afc05ca3677c9a501367a8b233e51f1`
 *    → 308 redirect → `https://recruitingbypaycor.com/career/CareerHome.action?clientId=8afc05ca3677c9a501367a8b233e51f1`
 *    → HTTP 200 server-rendered HTML listing the open role
 *    "Product Manager-SB" (Belgrade, Serbia) as an anchor to
 *    `…/career/JobIntroduction.action?clientId=8afc05ca3677c9a501367a8b233e51f1&id=8a7885a8995981cf0199626e7be7488b&source=&lang=en`.
 *  - That `JobIntroduction.action` detail page (opaque id `8a7885a8995981cf0199626e7be7488b`)
 *    → HTTP 200 with the title, "Belgrade, Serbia" location, and a body under
 *    "Job Summary" / "Duties and Core Responsibilities" headings.
 *  - Sibling tenants confirmed on the same `clientId`-addressed portal pattern:
 *    `8a7883c66f7d879b016f822d9b450444`, `8a7883c66439e9820164811e5f356ab1`,
 *    `8a3b93ee494f97ab014958e9169b5a58` (each a distinct organisation's career home).
 */

/** Canonical career-portal host (the legacy Newton host 308-redirects here). */
export const PAYCOR_CAREERS_HOST = 'https://recruitingbypaycor.com';

/**
 * Host fragments used to recognise a Paycor / Newton career URL passed via
 * `companyUrl`. The legacy `newtonsoftware.com` host redirects to the canonical
 * Paycor host but still carries the same `clientId` query token.
 */
export const PAYCOR_HOST_FRAGMENTS = ['recruitingbypaycor.com', 'newtonsoftware.com'];

/** Public, unauthenticated career-home path. Lists every open role for the tenant. */
export const PAYCOR_CAREER_HOME_PATH = '/career/CareerHome.action';

/** Public, unauthenticated per-role detail path. */
export const PAYCOR_JOB_INTRODUCTION_PATH = '/career/JobIntroduction.action';

/** Default UI language requested from the portal. */
export const PAYCOR_DEFAULT_LANG = 'en';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up to
 * 100 of the tenant's open roles.
 */
export const PAYCOR_DEFAULT_RESULTS = 100;

/** Default request headers. The portal expects a browser-like UA + HTML accept. */
export const PAYCOR_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Captures the opaque hex `clientId` token from a Paycor / Newton career URL's query
 * string (e.g. `…?clientId=8afc05ca3677c9a501367a8b233e51f1&…`).
 */
export const PAYCOR_CLIENT_ID_REGEX = /[?&]clientId=([0-9a-z]+)/i;

/**
 * Matches each open-role anchor on the career home: a `JobIntroduction.action` link
 * carrying the role's opaque hex `id`. Capture group 1 is the full href, group 2 the
 * opaque job id, group 3 the inner anchor text (the job title). Case-insensitive,
 * dot-all over the inner text.
 */
export const PAYCOR_JOB_LINK_REGEX =
  /<a\b[^>]*href="([^"]*JobIntroduction\.action[^"]*?[?&]id=([0-9a-z]+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Captures the opaque hex `id` token from a `JobIntroduction.action` href, used as a
 * fallback when the anchor regex's id group is empty.
 */
export const PAYCOR_JOB_ID_REGEX = /[?&]id=([0-9a-z]+)/i;

/**
 * Matches the job title on a detail page. Newton/Paycor detail pages render the title
 * in the document `<title>` ("{Job Title} - {Company}" / "{Job Title}") and as a bold
 * heading; the document title is the most reliable, so we mine it first.
 */
export const PAYCOR_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Matches the `og:title` meta when the portal emits one (more specific than `<title>`). */
export const PAYCOR_OG_TITLE_REGEX =
  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["'][^>]*>/i;

/** Matches the `og:description` meta (the role body summary) when present. */
export const PAYCOR_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/i;

/** Matches the meta `description` (fallback body summary) when present. */
export const PAYCOR_META_DESCRIPTION_REGEX =
  /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i;

/**
 * Captures the "{City}, {State|Country}" location line the detail page renders near
 * the title. The portal labels it with a "Location" cell / span; we tolerate either a
 * labelled cell or a bare comma-separated city/region token.
 */
export const PAYCOR_LOCATION_REGEX =
  /(?:Location|City)\s*[:<][\s\S]{0,200}?>([A-Za-z][A-Za-z .'-]+,\s*[A-Za-z][A-Za-z .'-]+)</i;

/** Captures the "Department" label's value on the detail / list page. */
export const PAYCOR_DEPARTMENT_REGEX =
  /Department\s*[:<][\s\S]{0,200}?>([A-Za-z][A-Za-z &.'/-]+)</i;

/** Captures an employment-type / job-type label's value on the detail page. */
export const PAYCOR_EMPLOYMENT_TYPE_REGEX =
  /(?:Employment Type|Job Type|Position Type)\s*[:<][\s\S]{0,200}?>([A-Za-z][A-Za-z .,&/-]+)</i;

/**
 * Captures the main job-body block on the detail page. Newton/Paycor render the body
 * inside a `description`-classed container; we grab its inner HTML so the description
 * formatter can convert it. Falls back to the meta description when absent.
 */
export const PAYCOR_DESCRIPTION_BLOCK_REGEX =
  /<div[^>]+class=["'][^"']*\b(?:description|jobDescription|job-description)\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i;

/** Detects remote / work-from-home roles across common US phrasings. */
export const PAYCOR_REMOTE_REGEX =
  /\b(remote|work\s*from\s*home|wfh|telecommute|telework|virtual|anywhere)\b/i;
