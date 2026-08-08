/**
 * Constants for the Kenjo careers platform.
 *
 * Kenjo (kenjo.io, Berlin/Madrid — a DE/ES SMB HR & ATS suite for small-and-medium
 * businesses) hosts a branded, public, unauthenticated, candidate-facing career site for
 * every customer tenant on a sub-domain of the shared host. The tenant is addressed by its
 * career-site sub-domain label (frequently `careers-{company}.kenjo.io`, or a bare
 * `{tenant}.kenjo.io`):
 *
 *   https://{tenant}.kenjo.io/                                (branded career site — Angular SPA)
 *   https://{tenant}.kenjo.io/positions/{customUrl}           (per-role public detail / apply page)
 *
 * The career site is a client-rendered Angular app that loads its data from a **public,
 * anonymous JSON API served on the tenant's own career-site origin** (the SPA derives the
 * API base from `document.location` and the career-site name from the leading hostname
 * label). The two endpoints the career site itself consumes are:
 *
 *   GET https://{tenant}.kenjo.io/api/controller/career-site/public/{tenant}            (career-site config + activePositions[])
 *   GET https://{tenant}.kenjo.io/api/controller/career-site/public/{tenant}/positions  (career-site config + activePositions[])
 *   GET https://{tenant}.kenjo.io/api/controller/career-site/public/{tenant}/positions/{customUrl}  (single role w/ jobDescription html)
 *
 * Neither endpoint requires a bearer token, cookie, or API key — they are the exact feed
 * the public career site renders from. The list endpoint returns a **career-site config
 * envelope** (company branding + metadata) carrying an `activePositions[]` array. Each
 * summary role in `activePositions[]` carries: `_id`, `jobTitle`, `customUrl`, `companyId`,
 * `officeId`, `positionType`, `companyName`, `officeName`, `pinned`. The full role
 * description (`jobDescription.html`) and `applicationFormFields` live on the per-role
 * detail endpoint (`/positions/{customUrl}`); the adapter fetches a bounded number of detail
 * records to enrich each role's body.
 *
 * The caller addresses a tenant by `companySlug` (the career-site sub-domain label, e.g.
 * `careers`) or by `companyUrl` (a career-site URL on a `kenjo.io` host whose leading
 * sub-domain label is the tenant). An unknown tenant, a tenant with no career site (HTTP
 * 404 `"Company career site was not found."`), an inactive board, or an empty
 * `activePositions[]` degrades naturally to an empty result. A fetch error, an HTTP 4xx, a
 * DNS failure, or a malformed body degrades to an empty / partial result rather than
 * throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.kenjo.io`) and the public,
 *    anonymous career-site API base (`/api/controller/career-site/public/{tenant}`),
 *    extracted from the live Angular bundle (`CAREER_SITE_CONTROLLER_URL =
 *    `${origin}/api/controller/career-site/public/`; the career-site name is the leading
 *    hostname label `host.split('.')[0]`).
 *  - Confirmed live against the real tenant `careers` (`careers.kenjo.io` — Kenjo GmbH's
 *    own career site, `active: true`): `GET .../public/careers/positions` returned HTTP 200
 *    with a career-site config envelope carrying `activePositions[]` (1 live role,
 *    `_id: 5dde37c7913b8600132907a9`, `jobTitle: "Initiative Application"`,
 *    `customUrl: "initiative"`, `positionType: "Full-time"`, `companyName: "Kenjo GmbH"`,
 *    `officeName: "Berlin"`).
 *  - Confirmed the per-role detail `GET .../public/careers/positions/initiative` (keyed by
 *    `customUrl`, NOT `_id`) returned HTTP 200 with `jobDescription.html` +
 *    `applicationFormFields` + `companyCareerSite`.
 *  - Confirmed the public detail page `https://careers.kenjo.io/positions/initiative`
 *    returned HTTP 200. verified=true.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const KENJO_ROOT_DOMAIN = 'kenjo.io';

/** Hosted careers host suffix — tenant sites live at `{tenant}.kenjo.io`. */
export const KENJO_CAREER_HOST_SUFFIX = '.kenjo.io';

/** Builds a tenant's career-site origin from its slug. */
export const kenjoCareerOrigin = (tenant: string): string =>
  `https://${tenant}${KENJO_CAREER_HOST_SUFFIX}`;

/**
 * Public, anonymous career-site API path prefix on the tenant career host. The career-site
 * name is appended (`{prefix}/{tenant}`), then `/positions` for the role list and
 * `/positions/{customUrl}` for a single role.
 */
export const KENJO_PUBLIC_CONTROLLER_PATH = 'api/controller/career-site/public';

/** Builds the public list endpoint URL (`{prefix}/{tenant}/positions`). */
export const kenjoPositionsUrl = (origin: string, tenant: string): string =>
  `${origin}/${KENJO_PUBLIC_CONTROLLER_PATH}/${encodeURIComponent(tenant)}/positions`;

/** Builds the public per-role detail endpoint URL (`{prefix}/{tenant}/positions/{customUrl}`). */
export const kenjoPositionDetailUrl = (
  origin: string,
  tenant: string,
  customUrl: string,
): string =>
  `${origin}/${KENJO_PUBLIC_CONTROLLER_PATH}/${encodeURIComponent(tenant)}/positions/${encodeURIComponent(customUrl)}`;

/** Builds the canonical public detail / apply page URL (`{origin}/positions/{customUrl}`). */
export const kenjoDetailPageUrl = (origin: string, customUrl: string): string =>
  `${origin}/positions/${encodeURIComponent(customUrl)}`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's active roles.
 */
export const KENJO_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on per-role detail fetches per scrape. The list endpoint returns every
 * active role in a single response (no pagination on the public surface); this ceiling
 * bounds the secondary detail-enrichment fan-out so an unusually large board never issues an
 * unbounded number of follow-up requests. The list is the authoritative role set; detail
 * fetches only enrich the description body.
 */
export const KENJO_MAX_DETAIL_FETCHES = 100;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Kenjo career host
 * can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well under
 * a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const KENJO_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The JSON API expects a browser-like UA + JSON Accept. */
export const KENJO_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,de;q=0.8,es;q=0.7',
};

/**
 * Non-tenant sub-domain labels rejected when deriving a tenant from a URL host (the bare
 * marketing / app / api hosts on `kenjo.io`).
 */
export const KENJO_NON_TENANT_LABELS = new Set(['www', 'app', 'api', 'help', 'sandbox-api']);

/**
 * Detects remote / home-working roles across the title, location, employment-type, and
 * description text — Kenjo's public role records carry no structured remote flag, so this
 * heuristic complements the free-text fields.
 */
export const KENJO_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|homeoffice|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere|teletrabajo|remoto)\b/i;
