/**
 * Constants for the PageUp recruitment / careers platform.
 *
 * PageUp (pageuppeople.com, global/APAC enterprise recruitment) hosts each
 * customer's candidate-facing careers site on the shared platform host
 * `careers.pageuppeople.com`, addressed by a numeric **instance id** path
 * segment:
 *
 *   https://careers.pageuppeople.com/{instanceId}/caw/en/listing/
 *
 * (`caw` is the standard candidate-application-website segment; a few tenants use
 * `cw` and/or a localised language token such as `en-us` instead — both are
 * tolerated. A handful of tenants additionally front the same product under a
 * custom careers host of the form `{tenant}.pageuppeople.com`; when the caller
 * supplies such a host via `companyUrl` it is used verbatim.)
 *
 * Unlike the SPA-style ATS portals, PageUp's listing index is **server-rendered**:
 * the `…/listing/` page carries real `<a href="…/job/{jobId}/{slug}">` anchors for
 * every open role, paginated via `?page={n}&page-items={m}`. The stable, crawlable
 * public surface is therefore two-fold:
 *
 *  1. The tenant's server-rendered listing index, which enumerates open roles:
 *
 *       GET https://careers.pageuppeople.com/{instanceId}/caw/en/listing/?page=1&page-items=100
 *         → HTML with one
 *             <a href="/{instanceId}/caw/en/job/{jobId}/{slug}">{title}</a>
 *           anchor per open position (plus category / work-type / closing-date
 *           cells alongside).
 *
 *  2. Each role's server-rendered detail page, which carries the role's fields as
 *     `<strong>`-labelled rows (and, where a tenant has enabled Google-for-Jobs, a
 *     schema.org `JobPosting` JSON-LD block):
 *
 *       GET https://careers.pageuppeople.com/{instanceId}/caw/en/job/{jobId}/{slug}
 *         → HTML carrying labelled fields:
 *             <strong>Job no:</strong> 509302
 *             <strong>Work type:</strong> Permanent
 *             <strong>Location:</strong> Newbury
 *             <strong>Categories:</strong> Logistics
 *             <strong>Advertised:</strong> 03 Jun 2026 GMT Daylight Time
 *             <strong>Applications close:</strong> 30 Jun 2026 GMT Daylight Time
 *           plus the usual `og:title` / `og:url` / `og:description` meta fallbacks
 *           and, when present, a schema.org `JobPosting` JSON-LD block.
 *
 * The listing index paginates, so we walk pages (bounded by `resultsWanted`) and
 * slice client-side. An unknown instance id (HTTP 404 / 4xx), a missing listing, a
 * malformed detail page, or a non-JSON JSON-LD block degrades to an empty
 * (graceful) result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform host `careers.pageuppeople.com`, the numeric
 *    instance-id addressing (`/{instanceId}/caw/en/listing/`), the server-rendered
 *    `…/job/{jobId}/{slug}` detail-link pattern, the `?page=&page-items=`
 *    pagination, and the `<strong>`-labelled detail fields against real, named
 *    tenants on it: `595` (Calor), `532` (SA Health), `533` (La Trobe University),
 *    `399` (Thiess), `527` (Asahi), `873` (CSU). The `pupcareers.pageuppeople.com`
 *    custom-host pattern was also confirmed live.
 */

/** Shared platform host that fronts every PageUp tenant careers site. */
export const PAGEUP_PLATFORM_HOST = 'https://careers.pageuppeople.com';

/** Root platform domain — used to recognise hosts passed via `companyUrl`. */
export const PAGEUP_ROOT_DOMAIN = 'pageuppeople.com';

/**
 * Default candidate-application-website (`caw`) path segments + language token used
 * to build a tenant's listing/detail URLs from a bare instance id. The `caw`/`en`
 * pair is the platform default; tenants on `cw` / localised languages are still
 * reached because we enumerate via absolute `…/job/…` hrefs parsed from the
 * listing HTML (whatever segment the tenant actually serves).
 */
export const PAGEUP_CAW_SEGMENT = 'caw';
export const PAGEUP_LANG_SEGMENT = 'en';

/** Public, unauthenticated server-rendered listing index path (per instance). */
export const PAGEUP_LISTING_PATH = 'listing/';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const PAGEUP_DEFAULT_RESULTS = 100;

/** Page size requested per listing page; pagination walks pages up to the cap. */
export const PAGEUP_PAGE_ITEMS = 100;

/** Hard ceiling on listing pages walked, so a runaway feed can never loop. */
export const PAGEUP_MAX_PAGES = 20;

/** Default request headers. The portal expects a browser-like UA. */
export const PAGEUP_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};

/**
 * Matches a job-detail anchor href in the listing HTML, capturing the instance id,
 * the full path, and the numeric job id. PageUp detail URLs are
 * `/{instanceId}/{caw|cw}/{lang}/job/{jobId}/{slug}`; the bare `/job/` index and
 * other site pages (listing / subscribe / login) carry no job id and are skipped.
 */
export const PAGEUP_JOB_HREF_REGEX =
  /href=["']((?:https?:\/\/[^"'/]+)?\/(\d+)\/[a-z-]+\/[a-z-]+\/job\/(\d+)\/[^"'?#]*)["']/gi;

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner
 * JSON text from a detail page. A page may carry several JSON-LD blocks
 * (Organization, BreadcrumbList, JobPosting); we scan them all for the
 * `JobPosting` object when a tenant has enabled Google-for-Jobs markup.
 */
export const PAGEUP_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts a `<meta property="og:…" content="…">` / `<meta name="…" content="…">` value. */
export const PAGEUP_OG_TITLE_REGEX = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const PAGEUP_OG_URL_REGEX = /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;
export const PAGEUP_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const PAGEUP_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;
/** Captures the role's `<h1>` heading text (the detail page's primary title). */
export const PAGEUP_H1_REGEX = /<h1[^>]*>([\s\S]*?)<\/h1>/i;

/**
 * `<strong>{Label}:</strong> {value}` field extractors for the labelled detail
 * rows PageUp renders. Each captures the trailing value up to the next tag break.
 */
export const PAGEUP_JOBNO_REGEX = /<strong>\s*Job\s*no:?\s*<\/strong>\s*([^<\n]+)/i;
export const PAGEUP_WORKTYPE_REGEX = /<strong>\s*Work\s*type:?\s*<\/strong>\s*([^<\n]+)/i;
export const PAGEUP_LOCATION_REGEX = /<strong>\s*Location:?\s*<\/strong>\s*([^<\n]+)/i;
export const PAGEUP_CATEGORIES_REGEX = /<strong>\s*Categories:?\s*<\/strong>\s*([^<\n]+)/i;
export const PAGEUP_ADVERTISED_REGEX = /<strong>\s*Advertised:?\s*<\/strong>\s*([^<\n]+)/i;

/** Detects remote / home-working roles across the title, location, and body text. */
export const PAGEUP_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote|hybrid)\b/i;
