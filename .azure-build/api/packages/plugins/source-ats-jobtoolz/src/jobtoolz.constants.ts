/**
 * Constants for the Jobtoolz careers platform.
 *
 * Jobtoolz (jobtoolz.com, Kortrijk — Belgium / Benelux) is an SMB applicant-tracking
 * system and employer-branding platform. Every customer tenant publishes a branded,
 * public, unauthenticated candidate-facing jobsite on the shared hosted careers host,
 * addressed by its company slug as a sub-domain:
 *
 *   https://{tenant}.jobtoolz.com/{locale}             (jobsite shell / open-roles board)
 *   https://{tenant}.jobtoolz.com/nl                   (Dutch board — the platform default)
 *   https://{tenant}.jobtoolz.com/en                   (English board)
 *   https://{tenant}.jobtoolz.com/fr                   (French board)
 *
 * The jobsite is a thin server-rendered shell whose open-roles board embeds the full
 * set of open vacancies directly in the HTML as the first argument of a JavaScript
 * bootstrap call wired through an Alpine.js attribute on the `<div id="vacatures">`
 * element:
 *
 *   <div id="vacatures" x-data="window.jobComponent(
 *       [ {&quot;id&quot;:760208638,&quot;title&quot;:&quot;…&quot;,&quot;url&quot;:&quot;…&quot;,…}, … ],
 *       999, … )">
 *
 * Because the array lives inside an HTML attribute, its JSON text is HTML-entity-encoded
 * (`&quot;`, `&amp;`, `&#39;`, …) rather than JS-string-escaped. The adapter captures the
 * bracketed array argument, HTML-decodes it, and `JSON.parse`s the result — mirroring the
 * Emply embedded-JSON precedent but with HTML-entity decoding instead of JS-string-literal
 * decoding. Each object carries:
 * `id` (numeric, the stable per-role ATS id), `title`, `button` (CTA label, ignored),
 * `url` (the canonical public detail / apply URL, e.g.
 * `https://{tenant}.jobtoolz.com/{locale}/{title-slug}`), `image_url`, `location`
 * (free-text place), `types` (free-text employment type, e.g. `Voltijds, Deeltijds`), and
 * a `filters` object (`filterIds`, `locationId`, `types[]`). The adapter parses this
 * embedded JSON rather than depending on volatile CSS class names or a client-rendered
 * DOM, so no headless browser is required.
 *
 * The vacancy summary in the board carries no rich HTML body; the canonical public detail
 * page (`url`) is the candidate-facing surface and doubles as the apply URL.
 *
 * An unknown tenant (DNS failure on `{tenant}.jobtoolz.com`), a tenant with no open roles
 * (the board renders an empty "geen openstaande vacatures" state → an empty embedded
 * array), or a locale that 302-redirects off to the tenant's default locale degrades
 * naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a malformed
 * body degrades to an empty / partial result rather than throwing, so a single bad tenant
 * never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.jobtoolz.com/{locale}`) and a
 *    real, named tenant on it: `tordale` (`https://tordale.jobtoolz.com/nl`).
 *  - Confirmed the open-roles board embeds the full vacancy set as the first argument of
 *    `window.jobComponent([ … ], 999, … )` (HTML-entity-encoded JSON) and that each
 *    vacancy carries a numeric `id`, `title`, a canonical `url`, `location`, and `types`
 *    (verified=true — 4 live roles were parsed, e.g. id `760208638`
 *    `…/nl/intrapenitentiaire-ondersteuning`). The detail `url` returns HTTP 200; a
 *    non-default locale (`/en` on a Dutch tenant) 302-redirects to the default locale.
 *    Other Jobtoolz-powered tenants seen: `boplan`, `vooruit`, `jobsdevleugels`, `jobs`.
 */

/** Hosted careers host suffix — tenant sites live at `{tenant}.jobtoolz.com`. */
export const JOBTOOLZ_CAREER_HOST_SUFFIX = '.jobtoolz.com';

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const JOBTOOLZ_ROOT_DOMAIN = 'jobtoolz.com';

/** Builds a tenant's jobsite origin from its slug. */
export const jobtoolzCareerOrigin = (tenant: string): string =>
  `https://${tenant}${JOBTOOLZ_CAREER_HOST_SUFFIX}`;

/**
 * Candidate open-roles board paths, tried in order. A Jobtoolz jobsite serves the board
 * at the locale root (`/{locale}`); the board renders the full embedded vacancy array on
 * that page. We try the platform's Benelux default (`nl`) first, then English, then
 * French; the first page that yields an embedded vacancy array wins. A non-default locale
 * 302-redirects to the tenant's default locale, which we surface as a fast, skippable
 * response rather than following.
 */
export const JOBTOOLZ_LOCALES: readonly string[] = ['nl', 'en', 'fr'];

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const JOBTOOLZ_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The open-roles board embeds the full
 * tenant vacancy set in a single document (no server-side pagination of the job set), so
 * one page is the norm; the ceiling guards any future variation.
 */
export const JOBTOOLZ_MAX_PAGES = 50;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Jobtoolz jobsite
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const JOBTOOLZ_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The jobsite expects a browser-like UA + HTML Accept. */
export const JOBTOOLZ_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8',
};

/**
 * Locates the start of the embedded vacancy array passed as the first argument of the
 * `window.jobComponent([ … ], …)` bootstrap call embedded (via an Alpine.js `x-data`
 * attribute) in the open-roles board HTML. The match ends at the opening `[` of the
 * array; the adapter then scans forward with HTML-entity-aware, string-aware bracket
 * balancing to capture the FULL array (the vacancy objects contain nested `filters`
 * arrays — `filterIds[]` / `types[]` — so a naive non-greedy `[…]` match would truncate
 * at the first nested `]`). The opening `[` index is `match.index + match[0].length - 1`.
 */
export const JOBTOOLZ_BOARD_REGEX = /window\.jobComponent\(\s*\[/i;

/** Detects remote / hybrid roles across the title, location, and employment-type fields. */
export const JOBTOOLZ_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working|office)|work\s*from\s*home|wfh|telework|telewerk|thuiswerk|hybride|hybrid|teletravail|t[ée]l[ée]travail)\b/i;
