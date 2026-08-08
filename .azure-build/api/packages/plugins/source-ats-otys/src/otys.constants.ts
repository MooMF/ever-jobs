/**
 * Constants for the OTYS recruitment-technology careers platform.
 *
 * OTYS (otys.com / otys.nl, Houten, Netherlands) is a recruitment-technology vendor
 * (ATS + recruitment CRM — "OTYS Go!") whose candidate-facing product is a hosted,
 * branded recruitment site / career page. Every customer tenant publishes a public,
 * unauthenticated recruitment site, either under its own (sub)domain
 * (e.g. `https://vacancy.{company}.com/`, `https://www.{company}.nl/`) or under an
 * OTYS-hosted application host `https://{clientprefix}.otysapp.com/`. The board is
 * **server-rendered HTML** (it is fed to Indeed, talent.com, and Google for Jobs),
 * so the stable, crawlable public surface is the HTML itself, mirroring the sibling
 * server-HTML ATS adapters:
 *
 *  1. The tenant's open-roles index page, which lists every published vacancy with
 *     a link to its detail page:
 *
 *       GET https://{host}/vacatures.html      (also /vacatures, /vacancies, "/")
 *         → HTML carrying one anchor per published vacancy of the canonical OTYS
 *           recruitment-site shape:
 *             /vacatures/vacature-{slug}-{id}-{websiteId}.html
 *           (the legacy underscore form `/vacatures/vacature_{slug}_{id}_{n}.html`
 *           is auto-redirected to the dashed form by OTYS), surrounded by the role
 *           title and location text.
 *
 *  2. Each vacancy's server-rendered detail page, which carries the full job-ad body
 *     plus title / location metadata (and, when present — OTYS supports Google for
 *     Jobs — a schema.org `JobPosting` JSON-LD block and `og:` meta tags used here
 *     as the preferred structured source):
 *
 *       GET https://{host}/vacatures/vacature-{slug}-{id}-{websiteId}.html
 *         → HTML detail page; optionally embedding
 *             <script type="application/ld+json">{ "@type": "JobPosting", … }</script>
 *           and `<meta property="og:title|og:description|og:url" …>`, falling back to
 *           the page `<title>` and body HTML.
 *
 * The numeric `{id}` path segment (e.g. `1481738`) is the stable OTYS vacancy id and
 * the per-role ATS id; `{websiteId}` is the OTYS portal/website number. The adapter
 * parses the index HTML for these links (rather than depending on volatile CSS class
 * names) and de-dups by `{id}`. An unknown host (DNS / HTTP 4xx), a missing index, a
 * malformed detail page, or a non-JSON JSON-LD block degrades to an empty (graceful)
 * / partial result rather than throwing, so a single bad tenant never breaks a batch
 * run.
 *
 * NOTE on the OTYS Web API: OTYS also exposes an authenticated REST/JSON Web API
 * (the successor to the old "Job API") at `https://webapi.otys.app/api` whose
 * `/api/vacancies` resource returns published vacancies — but it requires a
 * per-tenant API key (an unauthenticated request answers HTTP 401), so it is NOT a
 * public surface and is deliberately not used here. The public, anonymous surface is
 * the server-rendered recruitment-site HTML above.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing: customer-hosted recruitment sites
 *    and the OTYS application host `{clientprefix}.otysapp.com`, with the
 *    server-rendered recruitment-site vacancy URL shape
 *    `/vacatures/vacature-{slug}-{id}-{websiteId}.html`.
 *  - Confirmed live a real, named tenant: `middendorprecruitment` (Middendorp
 *    Recruitment, `https://www.middendorprecruitment.nl/vacatures.html`, 15 open
 *    roles at time of research), whose index lists the canonical vacancy links
 *    (e.g. `/vacatures/vacature-senior-accountmanager-amsterdam-noord-holland-fulltime-1481738-11.html`,
 *    `/vacatures/vacature-brand-manager-32-40-uur-1481267-11.html`), with the
 *    numeric `{id}` (`1481738`, `1481267`) serving as the per-role ATS id
 *    (verified=true). Detail pages render server-side; the JSON-LD / og: block is
 *    parsed when present and falls back to the `<title>` / body HTML otherwise.
 */

/**
 * OTYS application host template. When a caller passes a bare `companySlug`
 * (a client prefix), it is expanded to this OTYS-hosted recruitment host.
 */
export const OTYS_HOST_TEMPLATE = 'https://{tenant}.otysapp.com';

/** OTYS application root domain — recognises hosts/URLs passed via `companyUrl`. */
export const OTYS_ROOT_DOMAIN = 'otysapp.com';

/**
 * Additional OTYS-controlled hosts that may appear in a `companyUrl`. When a
 * `companyUrl` resolves to any of these (or to a custom customer domain), its origin
 * is used verbatim as the tenant board host.
 */
export const OTYS_ALT_DOMAINS = ['otys.com', 'otys.nl', 'otys.app'];

/**
 * Candidate index paths probed on a tenant board host, in order, until one yields
 * vacancy links. OTYS recruitment sites most commonly expose `/vacatures.html`
 * (Dutch) or `/vacatures`; English/custom boards use `/vacancies` or the site root.
 */
export const OTYS_INDEX_PATHS = ['/vacatures.html', '/vacatures', '/vacancies', '/'];

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up to
 * 100 of the tenant's published roles.
 */
export const OTYS_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on detail/index pages fetched per scrape, so a pathologically large
 * tenant board (or a very high `resultsWanted`) can never spin unbounded.
 */
export const OTYS_MAX_PAGES = 250;

/** Default request headers. The recruitment site expects a browser-like UA. */
export const OTYS_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
};

/**
 * Matches a canonical OTYS recruitment-site vacancy URL (absolute or relative) in
 * the index HTML, capturing the title slug, the numeric vacancy id, and the website
 * id from the shape `/vacatures/vacature-{slug}-{id}-{websiteId}.html`:
 *   group 1 = full path, group 2 = slug, group 3 = numeric vacancy id, group 4 = websiteId
 * Both `href="https://host/vacatures/…"` and `href="/vacatures/…"` forms match.
 */
export const OTYS_JOB_LINK_REGEX =
  /href=["'](?:https?:\/\/[^"'/]+)?(\/(?:vacatures|vacancies)\/vacature[-_](.+?)[-_](\d{3,})[-_](\d+)\.html)["']/gi;

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner JSON
 * text from a detail page, so we can scan them all for a `JobPosting` object.
 */
export const OTYS_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts `<meta property="og:…" content="…">` / `<title>…</title>` values. */
export const OTYS_OG_TITLE_REGEX =
  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const OTYS_OG_URL_REGEX =
  /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const OTYS_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const OTYS_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and body text. */
export const OTYS_REMOTE_REGEX =
  /\b(remote|thuiswerk(?:en)?|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|hybride|hybrid|fully\s*remote)\b/i;
