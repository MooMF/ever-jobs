/**
 * Constants for the Radancy career-site platform.
 *
 * Radancy (radancy.com — the enterprise Talent Acquisition Cloud, formerly TMP Worldwide;
 * its branded career sites are marketed as **TalentBrew**) powers each customer's public,
 * unauthenticated candidate-facing career site. Unlike the slug-on-a-shared-host SMB ATS
 * platforms, Radancy is **enterprise multi-tenant by hostname**: each customer's career site
 * lives on its own host — a vanity host (`careers.{brand}.com`), a Radancy-managed host
 * (`{brand}.jobs`), or the Radancy demo board (`jobs.radancy.com`). All of them run the same
 * TalentBrew front-end and expose the same public, anonymous job-results endpoint on their
 * own host:
 *
 *   GET https://{host}/{lang}/search-jobs/results?ActiveFacetID=0&CurrentPage={n}&RecordsPerPage={k}&FacetType=0
 *
 * The endpoint requires no bearer token / API key (it is the exact AJAX feed the career
 * site's own search page consumes) and returns a small JSON envelope:
 *
 *   { "filters":  "<html>",          // server-rendered facet sidebar (ignored)
 *     "results":  "<html>",          // server-rendered <ul> of job tiles (parsed)
 *     "hasJobs":  true,              // whether the board has any roles
 *     "hasContent": true }
 *
 * The `results` value is a server-rendered HTML fragment — a `<ul>` of job tiles. Each tile
 * is an `<li>` carrying:
 *
 *   <li class="… links-with-hover-lines__item">
 *     <h2><a class="links-with-hover-lines__link"
 *            href="/en/job/{location}/{slug}/{orgId}/{jobId}"
 *            data-job-id="{jobId}">{title}</a></h2>
 *     <span class="job-location">{location}</span>
 *     <button class="js-save-job-btn" data-job-id="{jobId}" data-org-id="{orgId}">…</button>
 *   </li>
 *
 * The adapter GETs this feed, parses the `results` HTML for the per-role anchor (title +
 * canonical detail href + `data-job-id`) and the adjacent `job-location` span, walks the
 * `CurrentPage` paginator until a page yields no tiles (or `hasJobs` is false), and maps each
 * role — rather than depending on a client-rendered DOM, a headless browser, or an
 * authenticated Radancy/ATS API. The canonical per-role public detail / apply page is the
 * anchor href resolved against the tenant host:
 *
 *   https://{host}/{lang}/job/{location}/{slug}/{orgId}/{jobId}
 *
 * The caller addresses a tenant by `companyUrl` (any TalentBrew career-site URL — its host is
 * the tenant) or by `companySlug` (treated as a host: a bare host is used as-is; a bare label
 * with no dot is expanded to the Radancy demo convention `{label}.radancy.com` as a
 * best-effort default, since Radancy has no single shared host suffix). An unknown host, a
 * board with no open roles, a DNS failure, an HTTP error, or a malformed body degrades
 * naturally to an empty / partial result rather than throwing, so a single bad tenant never
 * nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform is hostname-multi-tenant (one TalentBrew host per customer) and
 *    the public, anonymous results endpoint `GET /{lang}/search-jobs/results?...` returns the
 *    `{ filters, results, hasJobs, hasContent }` envelope on the tenant host.
 *  - Confirmed live against Radancy's own board `jobs.radancy.com` (org id `47123`): the
 *    `results` HTML carried real job tiles, e.g. anchor
 *    `href="/en/job/atlanta/customer-success-manager/47123/95942349392"`
 *    `data-job-id="95942349392"`, sibling `<span class="job-location">Atlanta, Georgia</span>`,
 *    and a `<button … data-org-id="47123">` save control. The sitemap confirms the canonical
 *    detail URL shape `/en/job/{location}/{slug}/{orgId}/{jobId}`.
 *  - Confirmed the same envelope shape on a second tenant host (`careers.aldi.us`),
 *    validating cross-host portability of the surface.
 *  - The `results` payload is server-rendered HTML (not structured JSON per field), so the
 *    per-role fields the adapter can read are limited to title, location, detail URL, org id,
 *    and job id; description / department / employment-type / posted-date are not present in
 *    the list fragment (they live on the detail page, intentionally not fetched here). The
 *    JSON ENVELOPE + endpoint + URL shape are verified; the per-tile HTML class names can
 *    drift across TalentBrew template versions, so the parser is defensive. verified=true.
 */

/** Root domain — used to recognise Radancy-managed hosts / the demo board. */
export const RADANCY_ROOT_DOMAIN = 'radancy.com';

/**
 * Best-effort host suffix for a bare `companySlug` label. Radancy has NO single shared host
 * suffix (tenants live on vanity / `.jobs` / managed hosts), so a bare label is expanded to
 * the Radancy demo convention `{label}.radancy.com`. Callers with a real career-site host
 * should pass `companyUrl` (or the full host as `companySlug`) for an exact match.
 */
export const RADANCY_HOST_SUFFIX = '.radancy.com';

/** Builds a best-effort career-site origin from a bare slug label. */
export const radancyCareerOrigin = (host: string): string => `https://${host}`;

/** Default language path segment in the TalentBrew URL space (`/{lang}/...`). */
export const RADANCY_DEFAULT_LANG = 'en';

/** Public, anonymous job-results path on the tenant career host (`/{lang}/search-jobs/results`). */
export const RADANCY_RESULTS_PATH = 'search-jobs/results';

/**
 * Records requested per results page. TalentBrew honours `RecordsPerPage`; we request a
 * large-ish page so a typical board drains in a few pages, with pagination drained
 * defensively for larger enterprise boards.
 */
export const RADANCY_PAGE_SIZE = 50;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const RADANCY_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on results pages fetched per scrape. Enterprise Radancy boards can be large,
 * but `resultsWanted` and the page size bound the typical sweep; the ceiling guards against
 * an unbounded paginator (12 × 50 = 600 roles).
 */
export const RADANCY_MAX_PAGES = 12;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive TalentBrew host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds in well under a second. A caller
 * may request a SHORTER timeout — we only bound the upper end.
 */
export const RADANCY_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The results feed expects a browser-like UA + JSON Accept. */
export const RADANCY_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  // TalentBrew serves the results feed from an XHR on its own search page; mirroring the
  // requested-with header keeps us on the AJAX response shape.
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Detects remote / home-working roles across the title and location fields (the list
 * fragment carries no structured remote flag).
 */
export const RADANCY_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere|virtual)\b/i;
