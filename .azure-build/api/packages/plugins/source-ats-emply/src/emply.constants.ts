/**
 * Constants for the Emply (Visma) careers platform.
 *
 * Emply (emply.com, Denmark — part of Visma) is a Nordic recruitment / HR ATS.
 * Every customer tenant publishes a branded, public, unauthenticated candidate-facing
 * career site on the shared host, addressed by its company slug as a sub-domain of
 * the hosted careers host:
 *
 *   https://{tenant}.career.emply.com/                       (career-site shell)
 *   https://{tenant}.career.emply.com/{locale}/vacant-positions   (open-roles index)
 *   https://{tenant}.career.emply.com/{locale}/vacancies          (alt index path)
 *   https://{tenant}.career.emply.com/{locale}/available-positions(alt index path)
 *
 * The career site is a thin server-rendered shell whose open-roles index page embeds
 * the full set of open vacancies directly in the HTML as a JavaScript bootstrap call:
 *
 *   proceedBatch({ vacancies : JSON.parse('[ … vacancy objects … ]'), … });
 *
 * The argument to `JSON.parse(...)` is a single-quoted JS string literal whose runtime
 * value is the JSON text; it escapes the characters special to a single-quoted JS
 * string (`\\`, `\'`, `\"`, `\/`, plus `\n` / `\r` / `\t` / `\uXXXX`). The browser
 * evaluates that literal and then `JSON.parse`s the result; the adapter mirrors this
 * (decoding the literal without `eval`, then JSON.parse). Each object carries:
 * `id`/`adId` (guids),
 * `publishingId` (int), `number` (int), `shortId` (a short opaque slug, e.g.
 * `vgxqup`), `title`, `titleAsUrl`, `department`, `location`, `published`, `created`,
 * `deadline`, `talentPool` (bool), `externalCseAdLink` (optional external ad URL), and
 * `translations[]` (each with `title` + an HTML `content` body). The adapter parses
 * this embedded JSON rather than depending on volatile CSS class names or a
 * client-rendered DOM, so no headless browser is required.
 *
 * Each role's canonical public detail page is built from the same record:
 *
 *   https://{tenant}.career.emply.com/{locale}/ad/{titleAsUrl}/{shortId}
 *
 * and the apply URL:
 *
 *   https://{tenant}.career.emply.com/{locale}/apply/{titleAsUrl}/{shortId}
 *
 * The `shortId` is the stable per-role ATS id (`publishingId` / `number` are kept as
 * defensive alternates). An unknown tenant, a tenant with no open roles, or a path
 * that renders the empty "We currently have no jobs available" state degrades
 * naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a
 * single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing
 *    (`{tenant}.career.emply.com/{locale}/vacant-positions`) and a real, named tenant
 *    on it: `au` (Aarhus University, `https://au.career.emply.com/en/vacant-positions`).
 *  - Confirmed the open-roles index embeds the full vacancy set as
 *    `proceedBatch({ vacancies : JSON.parse('[…]') })` and that each vacancy carries
 *    `shortId` + `titleAsUrl`, mapping to the canonical detail URL shape
 *    `/{locale}/ad/{titleAsUrl}/{shortId}` (verified=true — a live role
 *    `virksomhedskonsulent-til-…/vgxqup` was observed). Other Emply-powered tenants
 *    seen: `nspa-nato`, `semcomaritime`, `capital-four`, `navigatorgas`, `dao`.
 */

/** Hosted careers host suffix — tenant sites live at `{tenant}.career.emply.com`. */
export const EMPLY_CAREER_HOST_SUFFIX = '.career.emply.com';

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const EMPLY_ROOT_DOMAIN = 'emply.com';

/** Builds a tenant's career-site origin from its slug. */
export const emplyCareerOrigin = (tenant: string): string =>
  `https://${tenant}${EMPLY_CAREER_HOST_SUFFIX}`;

/**
 * Candidate open-roles index paths, tried in order. Tenants expose the open-roles
 * board under one of these (locale prefix applied per `EMPLY_LOCALES`); the first one
 * that yields an embedded vacancy batch wins.
 */
export const EMPLY_INDEX_PATHS: readonly string[] = [
  'vacant-positions',
  'vacancies',
  'available-positions',
  'jobs',
];

/**
 * Locale prefixes tried for the index path. Emply sites are localised; `en` is the
 * English board and `''` (no prefix) is the tenant's default locale. We try the
 * English board first, then the default, then Danish (the platform's home locale).
 */
export const EMPLY_LOCALES: readonly string[] = ['en', '', 'da'];

/** Career-site detail path segment (used to build canonical job-ad URLs). */
export const EMPLY_AD_PATH = 'ad';

/** Career-site apply path segment (used to build canonical apply URLs). */
export const EMPLY_APPLY_PATH = 'apply';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const EMPLY_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on index pages fetched per scrape. The open-roles index embeds the
 * full tenant board in a single document (no server-side pagination of the job set),
 * so one page is the norm; the ceiling guards any future variation.
 */
export const EMPLY_MAX_PAGES = 50;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Emply
 * career host can connect-then-hang, so we cap the shared client's 60s default to
 * keep graceful-degradation well inside callers' budgets; a healthy tenant
 * responds in well under a second. A caller may request a SHORTER timeout — we
 * only bound the upper end.
 */
export const EMPLY_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The career site expects a browser-like UA + HTML Accept. */
export const EMPLY_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Captures the single-quoted JS string literal passed to `JSON.parse(...)` inside the
 * `proceedBatch({ vacancies : JSON.parse('…') })` bootstrap call embedded in the
 * open-roles index HTML. The capture group is the raw (still JS-escaped) JSON text.
 */
export const EMPLY_BATCH_REGEX =
  /proceedBatch\(\s*\{\s*vacancies\s*:\s*JSON\.parse\(\s*'([\s\S]*?)'\s*\)/i;

/** Detects remote / home-working roles across the title, location, and department fields. */
export const EMPLY_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote|hjemmearbejde|fjernarbejde)\b/i;
