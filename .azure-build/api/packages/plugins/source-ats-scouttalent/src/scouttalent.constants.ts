/**
 * Constants for the Scout Talent applicant-tracking / recruitment careers platform.
 *
 * Scout Talent (scouttalent.com.au / scouttalent.com, AU / NZ) is a talent
 * acquisition vendor (recruitment CRM + ATS) whose candidate-facing product is a
 * hosted, branded careers board. Every customer tenant publishes a public,
 * unauthenticated career site on its own sub-domain of the shared application
 * portal `applynow.net.au`:
 *
 *   https://{tenant}.applynow.net.au/
 *
 * The board is server-rendered HTML (not a client-rendered SPA), so the stable,
 * crawlable public surface is the HTML itself, mirroring the sibling server-HTML
 * ATS adapters:
 *
 *  1. The tenant's open-roles index page, which lists every open position with a
 *     link to its detail page:
 *
 *       GET https://{tenant}.applynow.net.au/
 *         → HTML carrying one anchor per open role:
 *             <a href="https://{tenant}.applynow.net.au/jobs/{code}-{slug}">…</a>
 *           (the same path is also emitted relative: `/jobs/{code}-{slug}`),
 *           surrounded by the role title, location, and work-type text.
 *
 *  2. Each role's server-rendered detail page, which carries the full job-ad body
 *     plus title / location / work-type metadata (and, when present, a schema.org
 *     `JobPosting` JSON-LD block and `og:` meta tags used here as the preferred
 *     structured source):
 *
 *       GET https://{tenant}.applynow.net.au/jobs/{code}-{slug}
 *         → HTML detail page (Job No `{code}`, location, employment type, closing
 *           date, body), optionally embedding
 *             <script type="application/ld+json">{ "@type": "JobPosting", … }</script>
 *           and `<meta property="og:title|og:description|og:url" …>`.
 *
 * The index returns every open role for the tenant in one document (there is no
 * server-side pagination of the job set on the public board), so we fetch the
 * index once, collect its `/jobs/{code}-{slug}` links, and slice client-side to
 * honour `resultsWanted`. The per-role `{code}` segment (e.g. `J9380`, `PP05040`)
 * is the stable ATS id. An unknown sub-domain (HTTP 404 / 4xx), a missing index, a
 * malformed detail page, or a non-JSON JSON-LD block degrades to an empty
 * (graceful) / partial result rather than throwing, so a single bad tenant never
 * breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant host pattern `{tenant}.applynow.net.au` and a
 *    real, named tenant on it: `krg` (Ku-ring-gai Council), e.g.
 *    `https://krg.applynow.net.au/`.
 *  - Confirmed the live server-rendered index HTML and the per-role detail URL
 *    shape `…/jobs/{code}-{slug}` (e.g. `/jobs/J9380-manager-corporate-finance`,
 *    `/jobs/PP05040-parking-ranger`), with the leading `{code}` segment serving as
 *    the per-role ATS id (verified=true). The detail pages render server-side; the
 *    JSON-LD / og: block is parsed when present and falls back to the `<title>` /
 *    body HTML otherwise.
 */

/** Canonical tenant careers-board host template (applynow.net.au sub-domain). */
export const SCOUTTALENT_HOST_TEMPLATE = 'https://{tenant}.applynow.net.au';

/** Root portal domain — used to recognise tenant hosts passed via `companyUrl`. */
export const SCOUTTALENT_ROOT_DOMAIN = 'applynow.net.au';

/**
 * Alternative public portal domains Scout Talent fronts the same boards under.
 * When a `companyUrl` resolves to one of these, its origin is used verbatim.
 */
export const SCOUTTALENT_ALT_DOMAINS = ['applynow.com.au'];

/** Public, unauthenticated open-roles index path on a tenant board. */
export const SCOUTTALENT_INDEX_PATH = '/';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const SCOUTTALENT_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on detail pages fetched per scrape, so a pathologically large
 * tenant board (or a very high `resultsWanted`) can never spin unbounded.
 */
export const SCOUTTALENT_MAX_PAGES = 250;

/** Default request headers. The board expects a browser-like UA. */
export const SCOUTTALENT_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-AU,en;q=0.9',
};

/**
 * Matches a tenant job-detail URL (absolute or relative) in the index HTML,
 * capturing the role code (the leading `{code}` segment of `/jobs/{code}-{slug}`,
 * e.g. `J9380`, `PP05040`). The code is alphanumeric and followed by `-{slug}`.
 * Both `href="…/jobs/{code}-{slug}"` and `href="/jobs/{code}-{slug}"` forms match.
 */
export const SCOUTTALENT_JOB_LINK_REGEX =
  /href=["'](?:https?:\/\/[^"'/]+)?(\/jobs\/([A-Za-z0-9]+)-[^"'#?]+)["']/gi;

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner
 * JSON text from a detail page, so we can scan them all for a `JobPosting` object.
 */
export const SCOUTTALENT_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts `<meta property="og:…" content="…">` / `<title>…</title>` values. */
export const SCOUTTALENT_OG_TITLE_REGEX =
  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const SCOUTTALENT_OG_URL_REGEX =
  /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const SCOUTTALENT_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const SCOUTTALENT_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and body text. */
export const SCOUTTALENT_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
