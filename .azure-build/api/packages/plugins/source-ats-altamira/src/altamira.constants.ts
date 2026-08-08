/**
 * Constants for the Altamira Recruiting careers platform.
 *
 * Altamira (altamirahrm.com, Italy — "Altamira Recruiting") is an applicant
 * tracking system whose candidate-facing product is a hosted, branded career site.
 * Every customer tenant publishes a public, unauthenticated careers board on a
 * sub-domain of the shared host `altamiraweb.com`, addressed by its tenant label:
 *
 *   https://{tenant}.altamiraweb.com/             (e.g. https://rina.altamiraweb.com/)
 *   https://{tenant}.sites.altamiraweb.com/       (newer "sites" hosting variant,
 *                                                  e.g. https://etinars.sites.altamiraweb.com/)
 *
 * The board is **server-rendered HTML** (SEO-friendly — Altamira advertises the
 * career site as indexed by Google/Bing), so the open-roles index and per-role
 * detail pages are directly crawlable without authentication. The open-roles index
 * lives at `/jobs` (a `/default-cards` variant exists on some tenants) and lists
 * every open role as an anchor in two interchangeable forms:
 *
 *   SEO form:  /jobs/{Title-Country-Region-City-slug}-{JobID}.htm
 *   query form: /jobs/job-details?JobID={JobID}
 *
 * The trailing numeric `{JobID}` (e.g. `561445691`) is the stable ATS id, and the
 * SEO `.htm` slug additionally encodes the role title and a `Country-Region-City`
 * location tail. The canonical public detail / apply URL is the `.htm` page; its
 * `<title>` reads `"{Title} in {City} | Careers at {Tenant}"`, and the body carries
 * the full server-rendered job ad. No schema.org `JobPosting` JSON-LD or `og:` meta
 * is emitted, so the adapter derives title + location from the listing anchor's slug
 * (always present) and enriches the description from the detail page body
 * defensively (best-effort, never required).
 *
 * An unknown tenant (or one with no open roles) renders an empty board, so it
 * degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure,
 * or a malformed body degrades to an empty / partial result rather than throwing,
 * so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (sub-domains of `altamiraweb.com`,
 *    incl. the `*.sites.altamiraweb.com` variant) and real, named live tenants:
 *    `etinars` (Etinars — `https://etinars.sites.altamiraweb.com/`, 12 open roles at
 *    time of research), plus `rina` (RINA) and `zegnacareers` (EZ Service Srl) on the
 *    bare `*.altamiraweb.com` host.
 *  - Confirmed the server-rendered `/jobs` index lists each role with the canonical
 *    detail URL shapes `/jobs/{slug}-{JobID}.htm` and `/jobs/job-details?JobID={JobID}`
 *    (e.g. `/jobs/Desktop-Support-Engineer-...-Italia-Veneto-Padova-561445691.htm`),
 *    the trailing numeric `{JobID}` being the stable per-role ATS id, and the detail
 *    `<title>` shape `"{Title} in {City} | Careers at {Tenant}"` (verified=true).
 */

/** Root domain — used to recognise tenant hosts/URLs passed via `companyUrl`. */
export const ALTAMIRA_ROOT_DOMAIN = 'altamiraweb.com';

/**
 * Host template for a tenant's public careers board. `{tenant}` is the company
 * sub-domain label (e.g. `rina` → `https://rina.altamiraweb.com`). A tenant whose
 * board is hosted under the newer `*.sites.altamiraweb.com` variant is addressed by
 * passing that full host via `companyUrl` (or a `{tenant}.sites` slug); the bare
 * `{tenant}.altamiraweb.com` form is the default expansion of a plain slug.
 */
export const ALTAMIRA_HOST_TEMPLATE = 'https://{tenant}.altamiraweb.com';

/**
 * Public, server-rendered open-roles index path. Lists every open role with its
 * canonical detail URL. This is the enumeration surface. Some tenants additionally
 * expose a `/default-cards` view; `/jobs` is the stable, common path.
 */
export const ALTAMIRA_JOBS_PATH = '/jobs';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const ALTAMIRA_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on index pages fetched per scrape. The index can paginate
 * (`?PagerAnnunci={n}` / numbered page links), so we walk pages until we have enough
 * roles or a page yields nothing new; the ceiling guards runaway pagination.
 */
export const ALTAMIRA_MAX_PAGES = 50;

/** Default request headers. The board expects a browser-like UA + HTML Accept. */
export const ALTAMIRA_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches the canonical SEO Altamira job detail link inside the index HTML,
 * capturing the title+location slug and the trailing numeric job id:
 *   /jobs/{Title-Country-Region-City-slug}-{JobID}.htm
 */
export const ALTAMIRA_SEO_LINK_REGEX = /\/jobs\/([A-Za-z0-9][^"'?#\s]*?)-(\d{4,})\.htm/gi;

/**
 * Matches the query-string Altamira job detail link inside the index HTML,
 * capturing the trailing numeric job id:
 *   /jobs/job-details?JobID={JobID}
 */
export const ALTAMIRA_QUERY_LINK_REGEX = /\/jobs\/job-details\?JobID=(\d{4,})/gi;

/**
 * Detects remote / home-working roles across the title, location, and slug fields.
 * Includes Italian markers (the platform is Italy-based: "da remoto", "smart working").
 */
export const ALTAMIRA_REMOTE_REGEX =
  /\b(remote|remoto|da\s*remoto|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote|smart\s*working|telelavoro)\b/i;
