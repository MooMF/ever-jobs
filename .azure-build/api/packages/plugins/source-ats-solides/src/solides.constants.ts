/**
 * Constants for the Sólides (solides.com.br) careers platform.
 *
 * Sólides (solides.com.br, Brazil) is a Brazilian HCM / ATS ("Sólides Recruta" /
 * "Sólides Vagas"). Every customer tenant publishes a branded, public,
 * unauthenticated candidate-facing career site addressed by its company slug as a
 * sub-domain of the shared careers host:
 *
 *   https://{tenant}.vagas.solides.com.br/                  (career-site shell, Next.js SPA)
 *   https://{tenant}.vagas.solides.com.br/vaga/{id}         (per-role public detail page)
 *
 * The career site is a client-rendered Next.js SPA — the open roles are NOT in the
 * server-rendered HTML; they are fetched after hydration from the platform's public,
 * unauthenticated JSON API gateway:
 *
 *   GET https://apigw.solides.com.br/jobs/v3/home/vacancy?slug={tenant}&take={n}&page={p}
 *     → { success, errors, data: { count, currentPage, totalPages, data: [ vacancy ] } }
 *   GET https://apigw.solides.com.br/jobs/v3/home/company/{tenant}
 *     → company profile (used only to confirm a tenant exists / derive a brand name)
 *
 * The adapter calls the paginated `/home/vacancy` listing endpoint directly (no headless
 * browser, no API key) and maps each vacancy object. Each vacancy carries a numeric
 * `id` (the stable ATS id and the final segment of the canonical detail URL
 * `/{tenant}.vagas.solides.com.br/vaga/{id}`), an HTML `description`, `companyName`,
 * `state` / `city` / `address` objects, `jobType` / `homeOffice` flags, `createdAt`,
 * `occupationAreas` (department), `seniority`, and `recruitmentContractType`
 * (employment type). The adapter narrows everything defensively so cross-tenant or
 * future-shape drift never breaks the parser.
 *
 * The caller addresses a tenant by `companySlug` (e.g. `solides`) or by `companyUrl`
 * (any URL on a `vagas.solides.com.br` host whose leading sub-domain label encodes the
 * tenant). An unknown tenant, a tenant with no open roles, or an empty board degrades
 * naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a
 * single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.vagas.solides.com.br`) and
 *    the public JSON listing gateway
 *    `https://apigw.solides.com.br/jobs/v3/home/vacancy?slug={tenant}` — a real, named
 *    tenant `solides` (Sólides Tecnologia) returned `count: 29` live vacancies, e.g.
 *    role id `858464` ("ANALISTA DE SUPORTE JR - FOLHA DIGITAL"), and the canonical
 *    detail URL `https://solides.vagas.solides.com.br/vaga/858464` resolved 200.
 *  - Confirmed pagination via `take` (page size) + `page`, with the response carrying
 *    `count` / `currentPage` / `totalPages` (verified=true). Other tenants seen on the
 *    same gateway: `certifica`, `feeltech` (an empty board — a valid "no roles" result).
 */

/** Hosted careers host suffix — tenant sites live at `{tenant}.vagas.solides.com.br`. */
export const SOLIDES_CAREER_HOST_SUFFIX = '.vagas.solides.com.br';

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const SOLIDES_ROOT_DOMAIN = 'solides.com.br';

/** Public JSON API gateway base for the candidate-facing jobs surface. */
export const SOLIDES_API_BASE = 'https://apigw.solides.com.br/jobs/v3';

/** Listing endpoint path (paginated open-roles list for a tenant slug). */
export const SOLIDES_VACANCY_PATH = '/home/vacancy';

/** Company-profile endpoint path (tenant existence / brand-name lookup). */
export const SOLIDES_COMPANY_PATH = '/home/company';

/** Builds a tenant's public career-site origin from its slug. */
export const solidesCareerOrigin = (tenant: string): string =>
  `https://${tenant}${SOLIDES_CAREER_HOST_SUFFIX}`;

/** Builds the canonical public detail URL for a role from the tenant slug + numeric id. */
export const solidesVacancyUrl = (tenant: string, id: string): string =>
  `${solidesCareerOrigin(tenant)}/vaga/${encodeURIComponent(id)}`;

/**
 * Listing page size requested per call (the `take` query param). The SPA itself
 * requests 12 per page; we request a larger page to minimise round-trips while still
 * paging to honour `resultsWanted`.
 */
export const SOLIDES_PAGE_SIZE = 50;

/**
 * Hard ceiling on listing pages fetched per scrape. Bounds the page walk for a tenant
 * with a very large board so a single scrape can never run unbounded.
 */
export const SOLIDES_MAX_PAGES = 50;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const SOLIDES_DEFAULT_RESULTS = 100;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Sólides
 * gateway can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const SOLIDES_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The gateway expects a browser-like UA + JSON Accept. */
export const SOLIDES_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

/**
 * Detects remote / home-office roles across the title, location, job-type, and
 * department fields (Portuguese + English markers).
 */
export const SOLIDES_REMOTE_REGEX =
  /\b(remoto|remota|home[\s-]?office|trabalho\s*remoto|à\s*dist[âa]ncia|anywhere|remote|work\s*from\s*home|wfh|telecommute)\b/i;
