/**
 * Constants for the Expr3ss! careers platform.
 *
 * Expr3ss! (expr3ss.com — an Australian predictive-hiring applicant-tracking system) publishes
 * each customer tenant's branded, public, unauthenticated candidate-facing job board on a
 * per-tenant sub-domain of the shared root `expr3ss.com`, addressed by the tenant's company
 * slug as the host label:
 *
 *   https://{tenant}.expr3ss.com/home                 (open-roles board)
 *   https://{tenant}.expr3ss.com/home?mobile=no       (desktop board variant)
 *   https://{tenant}.expr3ss.com/ApplyOnline/Default.aspx?ID={id}   (per-role detail / apply)
 *
 * Unlike a single-host, slug-path ATS, Expr3ss! addresses a tenant by a dedicated sub-domain
 * (e.g. `cos.expr3ss.com`, `dnata.expr3ss.com`, `krispykreme.expr3ss.com`). The board is a
 * server-rendered page that lists each open role and is published for aggregators (Google for
 * Jobs, Indeed) with schema.org `JobPosting` JSON-LD embedded per role. The adapter fetches the
 * board HTML, harvests the embedded `JobPosting` JSON-LD island(s) — and, as a complementary
 * source, the per-role apply anchors carrying the role id — then maps each role and builds the
 * canonical detail / apply URL, rather than depending on a client-rendered DOM, a headless
 * browser, or an authenticated REST API. Each role's stable numeric id (the `ID` query value of
 * its apply URL, or the trailing id of its JSON-LD `url`) is the ATS id.
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g. `cos`) or by
 * `companyUrl` (a board URL on an `*.expr3ss.com` host whose host label is the tenant). An
 * unknown tenant, a tenant with no open roles, an empty board, or a challenge-gated board
 * degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a single bad
 * tenant never nukes a batch run.
 *
 * Surface confidence (researched 2026-06-04, no authentication; documented-but-unverified):
 *  - Confirmed the platform + tenant addressing: each tenant board lives on its own
 *    `{tenant}.expr3ss.com/home` sub-domain, with many real, named tenants live on it (e.g.
 *    `cos`, `dnata`, `humanology`, `peer`, `kelsian`, `provision`, `craveablebrands`,
 *    `krispykreme`, and Expr3ss!'s own `jobs`).
 *  - Could NOT extract live role JSON/HTML from a plain (non-headless) HTTP client: every
 *    `*.expr3ss.com` response (including the board, the apply path, and even `robots.txt` /
 *    `sitemap.xml`) is gated behind an edge managed-challenge that returns HTTP 403 with a
 *    `Cf-Mitigated: challenge` header to non-browser clients, so the role list / JSON-LD shape
 *    is not confirmed against a live extracted payload. The adapter is therefore built
 *    DEFENSIVELY against the documented board + apply-URL shape and the JobPosting JSON-LD the
 *    board publishes for aggregators: it degrades gracefully to an empty result when the
 *    challenge-gated board exposes no harvestable roles. verified=false.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const EXPR3SS_ROOT_DOMAIN = 'expr3ss.com';

/**
 * Builds the per-tenant board origin. Every tenant publishes on its own sub-domain of the
 * shared root, e.g. `https://cos.expr3ss.com`.
 */
export const expr3ssTenantOrigin = (tenant: string): string =>
  `https://${tenant}.${EXPR3SS_ROOT_DOMAIN}`;

/** Open-roles board page segment (the board lives at `{tenant}.expr3ss.com/home`). */
export const EXPR3SS_BOARD_PATH = 'home';

/**
 * Builds the public open-roles board URL for a tenant. The `?mobile=no` variant requests the
 * full desktop board (the richest listing) rather than the trimmed mobile rendering.
 */
export const expr3ssBoardUrl = (tenant: string): string =>
  `${expr3ssTenantOrigin(tenant)}/${EXPR3SS_BOARD_PATH}?mobile=no`;

/** Per-role public detail / apply path on a tenant sub-domain (`/ApplyOnline/Default.aspx`). */
export const EXPR3SS_APPLY_PATH = 'ApplyOnline/Default.aspx';

/**
 * Builds the canonical per-role detail / apply URL on a tenant sub-domain. The role's stable
 * numeric id is carried as the `ID` query value.
 */
export const expr3ssApplyUrl = (tenant: string, id: string): string =>
  `${expr3ssTenantOrigin(tenant)}/${EXPR3SS_APPLY_PATH}?ID=${encodeURIComponent(id)}`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const EXPR3SS_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The board renders the full tenant vacancy
 * list in a single document (no server-side pagination of the role set), so one page is the
 * norm; the ceiling guards the board-variant probe sweep.
 */
export const EXPR3SS_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Expr3ss! board host
 * can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well under a
 * second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const EXPR3SS_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The board expects a browser-like UA + HTML Accept. */
export const EXPR3SS_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-AU,en;q=0.9',
};

/**
 * Captures the schema.org `JobPosting` JSON-LD island(s) the board / detail pages embed for
 * aggregators (`<script type="application/ld+json">{ … }</script>`). When present it is the
 * richest structured source (title, datePosted, hiringOrganization, jobLocation, description,
 * url); the capture group is the raw JSON text (parsed with `JSON.parse`).
 */
export const EXPR3SS_JSONLD_REGEX =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Captures each per-role apply / detail anchor on the server-rendered board. The board lists
 * each open role as an `<a href="…/ApplyOnline/Default.aspx?ID={id}">` link; the first capture
 * group is the href, the second the anchor's inner HTML (used as a title fallback). Matches both
 * absolute and host-relative hrefs.
 */
export const EXPR3SS_JOB_ANCHOR_REGEX =
  /<a[^>]+href=["']([^"']*ApplyOnline\/Default\.aspx\?[^"']*\bID=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Extracts the stable numeric role id from a per-role URL — either the `ID={id}` query value of
 * an `ApplyOnline/Default.aspx` apply URL, or a trailing numeric id on a JSON-LD `url`.
 */
export const EXPR3SS_JOB_ID_REGEX = /(?:[?&]ID=|\/)(\d+)(?:[&#?/]|$)/i;

/**
 * Detects remote / home-working roles across the title and location fields (English + common
 * Australian variants), complementing any structured location data the board exposes.
 */
export const EXPR3SS_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|home[\s-]?based|work\s*from\s*home|wfh|fully\s*remote|telecommute|teleworking|hybrid|anywhere)\b/i;
