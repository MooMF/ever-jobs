/**
 * Constants for the Welcome to the Jungle (WTTJ) careers platform.
 *
 * Welcome to the Jungle (welcometothejungle.com, France / EU) is a recruitment and
 * employer-branding marketplace. Each company ("organization") publishes a branded,
 * public, unauthenticated jobs page on the shared host:
 *
 *   https://www.welcometothejungle.com/{lang}/companies/{slug}/jobs   (company jobs page)
 *
 * The open roles for a company are NOT scraped from that server-rendered HTML; instead
 * the candidate-facing front-end is powered by a **public, anonymous Algolia search
 * index** whose search-only credentials are embedded in the WTTJ front-end JavaScript.
 * The adapter queries that index directly (no headless browser, no API key of our own):
 *
 *   POST https://{appId-lower}-dsn.algolia.net/1/indexes/{index}/query
 *     headers: x-algolia-application-id, x-algolia-api-key, Referer (allow-listed)
 *     body:    { query: '', hitsPerPage, page, facetFilters: [["organization.slug:{slug}"]] }
 *
 * Each Algolia hit carries the role's `reference` (a stable per-role guid — the ATS id
 * and `objectID`), `name` (title), `slug` (the URL-safe per-role segment), `contract_type`,
 * `offices[]` (structured city/state/country), `published_at`, `remote`, `new_profession`
 * (category/sub-category), `summary` / `profile` / `key_missions` (HTML-ish body fragments),
 * salary parts, and the embedded `organization` object (its own `slug`, `name`, `reference`).
 * The adapter reads that JSON rather than depending on volatile CSS class names or a
 * client-rendered DOM, so no headless browser is required.
 *
 * Each role's canonical public detail page is built from the same record:
 *
 *   https://www.welcometothejungle.com/{lang}/companies/{org.slug}/jobs/{job.slug}
 *
 * and the apply URL appends `/apply`:
 *
 *   https://www.welcometothejungle.com/{lang}/companies/{org.slug}/jobs/{job.slug}/apply
 *
 * The `reference` guid is the stable per-role ATS id (`objectID` is the same value and is
 * kept as a defensive alternate). A company with no open roles, an unknown company slug,
 * or an empty index response degrades naturally to an empty result. A fetch error, an
 * HTTP 4xx, a DNS failure, or a malformed body degrades to an empty / partial result
 * rather than throwing, so a single bad company never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + company addressing
 *    (`welcometothejungle.com/{lang}/companies/{slug}/jobs`) and a real, named company
 *    on it: `groupe-partnaire` (Groupe Partnaire).
 *  - Confirmed the public Algolia index `wttj_jobs_production_en` (app `CSEKHVMS53`,
 *    embedded search key) answers the documented query with a Referer of
 *    `https://www.welcometothejungle.com/`, returning the per-role wire shape above:
 *    a `facetFilters` of `["organization.slug:groupe-partnaire"]` yielded 48 live roles
 *    (`nbHits: 48`), each with a `reference` guid + `slug` mapping to the canonical
 *    detail URL `/companies/{org.slug}/jobs/{job.slug}` (verified=true).
 */

/** Root domain — used to recognise company hosts / URLs passed via `companyUrl`. */
export const WTTJ_ROOT_DOMAIN = 'welcometothejungle.com';

/** Public, candidate-facing web origin used to build canonical detail / apply URLs. */
export const WTTJ_WEB_ORIGIN = 'https://www.welcometothejungle.com';

/**
 * Public Algolia application id powering the WTTJ candidate-facing job search. This is a
 * search-only credential embedded in the WTTJ front-end (not a secret of ours).
 */
export const WTTJ_ALGOLIA_APP_ID = 'CSEKHVMS53';

/**
 * Public Algolia search-only API key embedded in the WTTJ front-end. Search keys are
 * intentionally public (limited to read-only querying of the published job index).
 */
export const WTTJ_ALGOLIA_API_KEY = '4bd8f6215d0cc52b26430765769e65a0';

/**
 * Algolia job indexes tried in order. WTTJ maintains parallel localised indexes; the
 * `_en` index is the English-facing board and `_fr` the French. The first index that
 * answers with any hits for the company wins.
 */
export const WTTJ_ALGOLIA_INDEXES: readonly string[] = [
  'wttj_jobs_production_en',
  'wttj_jobs_production_fr',
];

/** Builds the Algolia DSN query endpoint for a given index. */
export const wttjAlgoliaQueryUrl = (index: string): string =>
  `https://${WTTJ_ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/${index}/query`;

/**
 * Builds a company's canonical public jobs-page URL from its slug (used as a sensible
 * fallback detail URL when a per-role slug is missing).
 */
export const wttjCompanyJobsUrl = (lang: string, slug: string): string =>
  `${WTTJ_WEB_ORIGIN}/${lang}/companies/${encodeURIComponent(slug)}/jobs`;

/** Default UI language segment for canonical detail / apply URLs. */
export const WTTJ_DEFAULT_LANG = 'en';

/**
 * Algolia page size requested per query. The index pages results; the adapter walks
 * pages (bounded by `WTTJ_MAX_PAGES`) until `resultsWanted` is satisfied or the pages
 * are exhausted.
 */
export const WTTJ_PAGE_SIZE = 100;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the company's open roles.
 */
export const WTTJ_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on Algolia pages fetched per scrape. Guards against an unexpectedly
 * large company board (or a pathological `nbPages`) burning the request budget.
 */
export const WTTJ_MAX_PAGES = 50;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Algolia DSN
 * can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy query responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const WTTJ_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The Algolia DSN allow-lists the WTTJ web origin via the
 * Referer header (a query without it is rejected as "Method not allowed with this
 * referer"); the search credentials travel in the `x-algolia-*` headers.
 */
export const WTTJ_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Referer: `${WTTJ_WEB_ORIGIN}/`,
  Origin: WTTJ_WEB_ORIGIN,
  'x-algolia-application-id': WTTJ_ALGOLIA_APP_ID,
  'x-algolia-api-key': WTTJ_ALGOLIA_API_KEY,
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Detects remote / home-working roles across the title, location, and profession fields. */
export const WTTJ_REMOTE_REGEX =
  /\b(remote|full[\s-]?remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|t[ée]l[ée]travail)\b/i;
