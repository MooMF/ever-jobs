/**
 * Constants for the Cezanne HR careers platform.
 *
 * Cezanne HR (cezannehr.com — a UK / EU mid-market HR + recruitment suite) publishes each
 * customer tenant's branded, public, unauthenticated candidate-facing careers / vacancies
 * board on the shared hosted careers host, addressed by the tenant's company slug as the
 * first path segment, followed by a language code and the `career` page:
 *
 *   https://cezanneondemand.intervieweb.it/{tenant}/{lang}/career        (open-roles board)
 *   https://cezanneondemand.intervieweb.it/{tenant}/{lang}/jobvacancy/{slug}/{id}  (per-role detail / apply)
 *
 * The hosted careers surface is the Cezanne Recruitment careers-page host (Cezanne
 * OnDemand). The board is a server-rendered page that lists each open role as an anchor
 * to its per-role detail page; each detail URL carries a stable numeric vacancy `id` as
 * its final path segment (the stable ATS id). The adapter fetches the board HTML, harvests
 * the per-role `jobvacancy` anchors (and any embedded schema.org `JobPosting` JSON-LD when
 * present), maps each role, and builds the canonical detail / apply URL — rather than
 * depending on a client-rendered DOM, a headless browser, or an authenticated REST API.
 *
 * The caller addresses a tenant by `companySlug` (the first path segment, e.g.
 * `bluecresthealth`) or by `companyUrl` (a careers-board URL on the hosted careers host
 * whose first path segment is the tenant). An unknown tenant, a tenant with no open roles,
 * an empty board, or a session-gated board degrades naturally to an empty result. A fetch
 * error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an empty / partial
 * result rather than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication; documented-but-unverified):
 *  - Confirmed the platform + tenant addressing live: the hosted careers host
 *    `cezanneondemand.intervieweb.it` serves a tenant board at `/{tenant}/{lang}/career`,
 *    with many real, named tenants on it (e.g. `bluecresthealth`, `orecatapult`, `turing`,
 *    `croesus`, `unity`, `msfuk`, `inspirationhealthcare`, `ymcaderbyshire`).
 *  - Confirmed the per-role detail path segment `jobvacancy` is accepted by the host
 *    (the canonical `/{tenant}/{lang}/jobvacancy/{slug}/{id}` shape) and that an
 *    `/api/{VERSION}/...` REST endpoint exists but is version / credential keyed (NOT the
 *    anonymous candidate surface, so it is deliberately NOT used here).
 *  - Could NOT extract live role JSON from a plain (non-headless) HTTP client: the
 *    anonymous board performs a client-side session / CSRF bootstrap (a `302` to
 *    `access.php`) behind Cloudflare before rendering roles, so the role list is not
 *    confirmed against a live extracted payload. The adapter is therefore built
 *    DEFENSIVELY against the documented board + detail-URL shape: it degrades gracefully to
 *    an empty result when the session-bootstrapped board exposes no harvestable roles.
 *    verified=false.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const CEZANNE_ROOT_DOMAIN = 'intervieweb.it';

/** Hosted careers host — every tenant board lives under this single shared host. */
export const CEZANNE_CAREER_HOST = 'cezanneondemand.intervieweb.it';

/** Builds the hosted careers origin (the shared host serving every tenant board). */
export const cezanneCareerOrigin = (): string => `https://${CEZANNE_CAREER_HOST}`;

/**
 * Language codes tried in order when building the tenant board URL
 * `/{tenant}/{lang}/career`. English first (the default candidate-facing locale); the
 * others are defensive fallbacks for tenants that only publish a localised board. The
 * first locale whose board yields harvestable roles wins.
 */
export const CEZANNE_LANGS: readonly string[] = ['en', 'it', 'es', 'fr', 'de'];

/** Careers-board page segment (the open-roles board lives at `/{tenant}/{lang}/career`). */
export const CEZANNE_CAREER_PATH = 'career';

/** Per-role public detail path segment (used to build / recognise `jobvacancy` URLs). */
export const CEZANNE_JOBVACANCY_PATH = 'jobvacancy';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const CEZANNE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The board renders the full tenant
 * vacancy list in a single document (no server-side pagination of the role set), so one
 * page is the norm; the ceiling guards the per-locale probe sweep.
 */
export const CEZANNE_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Cezanne careers
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const CEZANNE_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The careers board expects a browser-like UA + HTML Accept. */
export const CEZANNE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Captures the schema.org `JobPosting` JSON-LD island(s) the careers board / detail pages
 * may embed (`<script type="application/ld+json">{ … }</script>`). When present it is the
 * richest structured source (title, datePosted, hiringOrganization, jobLocation,
 * description, url); the capture group is the raw JSON text (parsed with `JSON.parse`).
 */
export const CEZANNE_JSONLD_REGEX =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Captures each per-role detail anchor on the server-rendered board. The board lists each
 * open role as an `<a href="…/{tenant}/{lang}/jobvacancy/{slug}/{id}">` link; the first
 * capture group is the href, the second the anchor's inner HTML (used as a title
 * fallback). Matches both absolute and host-relative hrefs.
 */
export const CEZANNE_JOB_ANCHOR_REGEX =
  /<a[^>]+href=["']([^"']*\/jobvacancy\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Extracts the trailing numeric vacancy id from a `jobvacancy` detail URL
 * (`…/jobvacancy/{slug}/{id}` — the `{id}` is the stable ATS id).
 */
export const CEZANNE_JOB_ID_REGEX = /\/jobvacancy\/[^/?#]+\/(\d+)(?:[/?#]|$)/i;

/**
 * Detects remote / home-working roles across the title and location fields (English +
 * common EU-locale variants), complementing any structured location data.
 */
export const CEZANNE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|home[\s-]?based|work\s*from\s*home|wfh|fully\s*remote|télétravail|teletrabajo|smart\s*working)\b/i;
