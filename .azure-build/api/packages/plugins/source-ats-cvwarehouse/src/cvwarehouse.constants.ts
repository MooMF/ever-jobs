/**
 * Constants for the CVWarehouse careers platform.
 *
 * CVWarehouse (cvwarehouse.com — a Belgian / EU applicant-tracking platform headquartered in
 * Antwerp, with an additional office in Lisbon) powers each customer's branded, public,
 * unauthenticated candidate-facing job board on the shared host
 * `https://jobpage.cvwarehouse.com/`, addressed by a per-tenant **company GUID**:
 *
 *   https://jobpage.cvwarehouse.com/?companyGuid={guid}&lang={lang}          (branded job board)
 *   https://jobpage.cvwarehouse.com/?companyGuid={guid}&lang={lang}&job={id} (per-role deep link)
 *
 * Unlike a sub-domain ATS, CVWarehouse addresses a tenant by a 36-char company GUID on the
 * shared `jobpage.cvwarehouse.com` host. The board is **server-rendered HTML** (not a
 * client-rendered SPA): a single GET of the board URL returns the full set of the tenant's open
 * roles AND, inline in the same document, every role's complete detail block — so the adapter
 * needs exactly one fetch per tenant and never depends on a headless browser or an authenticated
 * API. The host bakes the public job data into the page as:
 *
 *   1. A listing anchor per role:
 *        <a class="jobLink" data-item="readmore" data-jobid="394655"
 *           data-titleslug="Software-Developer-…"
 *           href="?companyGuid={guid}&lang={lang}&job=394655&q=Software-Developer-…">
 *           <span>Software Developer …</span></a>
 *      The `data-jobid` is the stable numeric ATS id; the `<span>` holds the display title; the
 *      `href`'s `q` is the title slug.
 *
 *   2. A hidden detail block per role, holding the full job ad body + the apply URL:
 *        <div data-jobdetail-job-id="394655" data-section="{sectionGuid}"
 *             data-canonical-url="https://jobpage.cvwarehouse.com/?companyGuid={guid}&job=394655&lang={lang}">
 *           … rendered HTML description …
 *           <a class="btn-apply"
 *              href="/ApplicationForm/AppForm?job=394655&companyGuid={guid}&lang={lang}&channel=own_website">
 *              Apply</a>
 *        </div>
 *
 *   3. Roles are grouped into collections (the tenant's job sections / locations):
 *        <div data-item-collection="jobCollection-{sectionGuid}"
 *             data-filter-country="176" data-filter-city="…">…</div>
 *      `data-filter-country` is an ISO-3166 numeric country code (e.g. `176` for the tenant's
 *      primary country); `data-filter-city` is a free-text city, when present.
 *
 * The adapter resolves the tenant GUID from `companySlug` (treated as the company GUID) or from
 * a `companyUrl` on a `jobpage.cvwarehouse.com` host (the `companyGuid` query param), GETs the
 * board HTML once, parses every role anchor + its sibling detail block, and maps each role —
 * rather than depending on a client-rendered DOM, a headless browser, or any authenticated
 * CVWarehouse API. An unknown GUID, a tenant with no published roles, or an empty board degrades
 * naturally to an empty result. A fetch error, an HTTP 4xx / 5xx, a DNS failure, or a malformed
 * body degrades to an empty / partial result rather than throwing, so a single bad tenant never
 * nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-04, no authentication):
 *  - Confirmed the platform + GUID addressing (`jobpage.cvwarehouse.com/?companyGuid={guid}&lang={lang}`)
 *    and that the board is server-rendered (full job markup present in the initial HTML, no XHR
 *    to a private feed required).
 *  - Confirmed `GET https://jobpage.cvwarehouse.com/?companyGuid=0875aa48-21be-43a2-b7cd-1ca7b94b2249&lang=en-US`
 *    (a live tenant) returns 15 roles anonymously, each as a
 *    `<a class="jobLink" data-jobid="394655" data-titleslug="…" href="?…&job=394655&q=…">` anchor
 *    plus a sibling `<div data-jobdetail-job-id="394655" data-canonical-url="…">` detail block
 *    bearing the full HTML body and a `/ApplicationForm/AppForm?job=394655&companyGuid=…&channel=own_website`
 *    apply link.
 *  - Confirmed a tenant with no open roles (`companyGuid=2a262ee8-e55c-463c-b086-67babe5f31ba`)
 *    returns the board chrome with zero `jobLink` anchors (drain-to-empty).
 *    verified=true.
 */

/** Root domain — used to recognise tenant URLs passed via `companyUrl`. */
export const CVWAREHOUSE_ROOT_DOMAIN = 'cvwarehouse.com';

/** Public candidate-facing job-board host — tenant boards live at `jobpage.cvwarehouse.com/?companyGuid={guid}`. */
export const CVWAREHOUSE_BOARD_HOST = 'jobpage.cvwarehouse.com';

/** Public board origin (where the server-rendered board + per-role detail blocks live). */
export const CVWAREHOUSE_BOARD_ORIGIN = 'https://jobpage.cvwarehouse.com';

/** Query-param name the board uses to address a tenant (a 36-char company GUID). */
export const CVWAREHOUSE_COMPANY_PARAM = 'companyGuid';

/** Query-param name the board uses to select a UI / content language. */
export const CVWAREHOUSE_LANG_PARAM = 'lang';

/**
 * Default content language requested from the board. CVWarehouse tenants are EU-based and most
 * publish an English rendering; a tenant that lacks `en-US` still returns its roles (titles /
 * bodies fall back to the tenant's default locale).
 */
export const CVWAREHOUSE_DEFAULT_LANG = 'en-US';

/** Builds the public, anonymous board URL for a tenant company GUID + language. */
export const cvwarehouseBoardUrl = (
  companyGuid: string,
  lang: string = CVWAREHOUSE_DEFAULT_LANG,
): string => {
  const params = new URLSearchParams({
    [CVWAREHOUSE_COMPANY_PARAM]: companyGuid,
    [CVWAREHOUSE_LANG_PARAM]: lang,
  });
  return `${CVWAREHOUSE_BOARD_ORIGIN}/?${params.toString()}`;
};

/** Builds a public per-role deep-link URL on the board host. */
export const cvwarehouseJobUrl = (
  companyGuid: string,
  jobId: string,
  lang: string = CVWAREHOUSE_DEFAULT_LANG,
  slug?: string | null,
): string => {
  const params = new URLSearchParams({
    [CVWAREHOUSE_COMPANY_PARAM]: companyGuid,
    [CVWAREHOUSE_LANG_PARAM]: lang,
    job: jobId,
  });
  if (slug) params.set('q', slug);
  return `${CVWAREHOUSE_BOARD_ORIGIN}/?${params.toString()}`;
};

/** Builds a public apply-form URL on the board host for a role. */
export const cvwarehouseApplyUrl = (
  companyGuid: string,
  jobId: string,
  lang: string = CVWAREHOUSE_DEFAULT_LANG,
  slug?: string | null,
): string => {
  const params = new URLSearchParams({
    job: jobId,
    [CVWAREHOUSE_COMPANY_PARAM]: companyGuid,
    [CVWAREHOUSE_LANG_PARAM]: lang,
  });
  if (slug) params.set('q', slug);
  params.set('channel', CVWAREHOUSE_APPLY_CHANNEL);
  return `${CVWAREHOUSE_BOARD_ORIGIN}/ApplicationForm/AppForm?${params.toString()}`;
};

/**
 * `channel` value the tenant's own board sends for an apply from the public career page.
 * Mirroring it keeps any derived apply URL on the documented public board path.
 */
export const CVWAREHOUSE_APPLY_CHANNEL = 'own_website';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const CVWAREHOUSE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The board renders every open role of a tenant
 * in a single server-rendered document, so one fetch is normally sufficient; this cap exists to
 * bound any future language / section sweep and guard against an unbounded loop.
 */
export const CVWAREHOUSE_MAX_PAGES = 5;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive CVWarehouse host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds in well under a second. A caller may
 * request a SHORTER timeout — we only bound the upper end.
 */
export const CVWAREHOUSE_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The board serves plain server-rendered HTML to anonymous visitors;
 * mirroring a browser-like UA + an HTML Accept keeps us on the public anonymous path.
 */
export const CVWAREHOUSE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: `${CVWAREHOUSE_BOARD_ORIGIN}/`,
};

/**
 * Detects remote / home-working roles across the title, location, and description fields. The
 * board is bilingual (EN / FR / NL / PT), so the pattern covers the common EU spellings.
 */
export const CVWAREHOUSE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|home[\s-]?working|t[ée]l[ée]travail|thuiswerk|teletrabalho|telecommute|wfh|work\s*from\s*home|fully\s*remote|hybrid|hybride|anywhere)\b/i;

/**
 * ISO-3166 numeric → display-country map for the handful of EU countries CVWarehouse tenants
 * advertise via `data-filter-country`. An unmapped code degrades to null (no country surfaced)
 * rather than guessing.
 */
export const CVWAREHOUSE_COUNTRY_CODES: Record<string, string> = {
  '056': 'Belgium',
  '56': 'Belgium',
  '250': 'France',
  '276': 'Germany',
  '442': 'Luxembourg',
  '528': 'Netherlands',
  '620': 'Portugal',
  '724': 'Spain',
  '826': 'United Kingdom',
  '372': 'Ireland',
  '040': 'Austria',
  '40': 'Austria',
  '756': 'Switzerland',
  '380': 'Italy',
  '176': 'Portugal',
};
