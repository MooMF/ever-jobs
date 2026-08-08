/**
 * Constants for the Breathe HR careers platform.
 *
 * Breathe (breathehr.com — a UK SMB people-management / HR suite, Horsham, with a built-in
 * recruitment module) lets each customer publish public, unauthenticated, candidate-facing
 * vacancies on the shared, Breathe-owned host `https://hr.breathehr.com/`. When a tenant
 * publishes a vacancy, Breathe mints a stable public "share" URL the employer embeds across
 * their own careers page and social channels:
 *
 *   https://hr.breathehr.com/v/{slug}-{vacancyId}   (per-role public detail / apply page)
 *
 * where `{slug}` is the de-slugified role title and the trailing `{vacancyId}` is the tenant's
 * stable numeric recruitment vacancy id (the ATS id). The legacy app host `app.breathehr.com`
 * 301-redirects onto `hr.breathehr.com`; the authenticated recruitment management UI
 * (`/recruitment/vacancies`) 302-redirects to `login.breathehr.com`, but the `/v/{slug}-{id}`
 * share page is fully anonymous.
 *
 * Each `/v/{slug}-{id}` page is a **server-rendered HTML document** (no client-side rendering
 * needed) carrying the role's structured fields in stable, class-named markup:
 *
 *   - `<title>` and `<p class='vacancy-company'>` → the employer / tenant display name
 *     ("Vacancy at {Company}").
 *   - `<div class='job-title'>` → the role title.
 *   - `<div class='salary'>` → a "Salary" label followed by the salary value.
 *   - `<div class='location'>` → the role location (after a map-marker icon).
 *   - `<div class='vacancy-dates'>` with two `<div class='vacancy-date'>` blocks labelled
 *     `<strong>Vacancy listed</strong>` (the posted date, `DD/MM/YYYY`) and
 *     `<strong>Application deadline</strong>` (the closing date).
 *   - `<div class='trix-content'>` (inside `<div class='vacancy-subsection-details'>`) → the
 *     rich HTML job description body.
 *   - `<meta property='og:url'>` → the page's own canonical URL.
 *
 * Breathe does not expose a public, anonymous per-tenant vacancy INDEX on its own host (the
 * `*.breathehr.com` tenant sub-domain and the management board both redirect to login). Tenants
 * instead surface their open roles by embedding the `/v/{slug}-{id}` share links on their own
 * public careers page. The adapter therefore addresses a tenant by `companyUrl` — the tenant's
 * own public careers / vacancies page — and harvests every `hr.breathehr.com/v/{slug}-{id}`
 * link from it, then fetches and parses each vacancy detail page. A `companySlug` that is itself
 * a `/v/{slug}-{id}` share URL (or a bare `{slug}-{id}` vacancy token) is fetched directly as a
 * single vacancy.
 *
 * Surface confidence (researched + verified live 2026-06-04, no authentication):
 *  - Confirmed the per-role public share page `GET https://hr.breathehr.com/v/{slug}-{id}`
 *    returns a 200 server-rendered HTML document anonymously (e.g.
 *    `/v/finance-administration-officer-43173`, `/v/advocacy-worker-43996`), and that an
 *    unknown token returns HTTP 404.
 *  - Confirmed the page markup: `<div class='job-title'>`, `<p class='vacancy-company'>`
 *    ("Vacancy at Partners in Advocacy"), `<div class='salary'>`, `<div class='location'>`,
 *    the two `<div class='vacancy-date'>` blocks ("Vacancy listed" 25/09/2025, "Application
 *    deadline" 21/11/2025), and the `<div class='trix-content'>` description body — all
 *    present and stable.
 *  - Confirmed the trailing numeric segment of the share-URL slug is the stable vacancy id, and
 *    that `app.breathehr.com` 301-redirects to `hr.breathehr.com`.
 *  - The per-tenant vacancy INDEX is sourced from the tenant's OWN careers page (Breathe does
 *    not host a public index), so resolution from `companyUrl` is a best-effort harvest of the
 *    embedded share links rather than a Breathe-owned feed. verified=true (per-role surface
 *    confirmed live; the index step is a documented best-effort harvest).
 */

/** Root domain — used to recognise Breathe vacancy URLs passed via `companySlug` / `companyUrl`. */
export const BREATHEHR_ROOT_DOMAIN = 'breathehr.com';

/** Public candidate-facing host — published vacancies live at `hr.breathehr.com/v/{slug}-{id}`. */
export const BREATHEHR_VACANCY_HOST = 'hr.breathehr.com';

/** Public vacancy origin (where per-role `/v/{slug}-{id}` detail pages live). */
export const BREATHEHR_VACANCY_ORIGIN = 'https://hr.breathehr.com';

/** Path prefix of a public per-role vacancy share page (`/v/{slug}-{id}`). */
export const BREATHEHR_VACANCY_PATH_PREFIX = '/v/';

/** Builds the public per-role vacancy detail URL for a `{slug}-{id}` token. */
export const breathehrVacancyUrl = (token: string): string =>
  `${BREATHEHR_VACANCY_ORIGIN}${BREATHEHR_VACANCY_PATH_PREFIX}${encodeURIComponent(token)}`;

/**
 * Matches a per-role vacancy share link (`https://hr.breathehr.com/v/{slug}-{id}`) anywhere in
 * an HTML document — used to harvest a tenant's open roles from their own careers page. The
 * capture group is the `{slug}-{id}` token (the trailing `-{id}` is the stable vacancy id).
 */
export const BREATHEHR_VACANCY_LINK_REGEX =
  /https?:\/\/hr\.breathehr\.com\/v\/([a-z0-9][a-z0-9-]*-\d+)/gi;

/**
 * Matches a bare `{slug}-{id}` vacancy token (e.g. `advocacy-worker-43996`) — used when a caller
 * passes the vacancy token directly as `companySlug` rather than a full URL.
 */
export const BREATHEHR_VACANCY_TOKEN_REGEX = /^[a-z0-9][a-z0-9-]*-\d+$/i;

/** Extracts the trailing numeric vacancy id (the ATS id) from a `{slug}-{id}` token. */
export const BREATHEHR_VACANCY_ID_REGEX = /-(\d+)$/;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const BREATHEHR_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on per-role detail pages fetched per scrape. A tenant careers page can embed an
 * arbitrary number of share links; the ceiling guards against a pathological page and bounds the
 * fan-out independent of `resultsWanted`.
 */
export const BREATHEHR_MAX_PAGES = 100;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy vacancy page responds in well under a second. A caller
 * may request a SHORTER timeout — we only bound the upper end.
 */
export const BREATHEHR_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. Breathe serves the public vacancy pages as plain HTML; a browser-like
 * UA and an HTML Accept keep us on the public anonymous path.
 */
export const BREATHEHR_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Detects remote / home-working roles across the title, location, and description fields. Breathe
 * carries no structured remote flag, so detection is text-based.
 */
export const BREATHEHR_REMOTE_REGEX =
  /\b(remote|home[\s-]?working|home[\s-]?based|work\s*from\s*home|wfh|telecommute|teleworking|hybrid|fully\s*remote|anywhere)\b/i;
