/**
 * Constants for the Bizneo HR careers platform.
 *
 * Bizneo HR (bizneo.com, Spain) is a talent-acquisition suite (recruiting CRM +
 * ATS) whose candidate-facing product is a hosted, branded Career Site. Every
 * customer tenant publishes a branded, public, unauthenticated careers board on
 * its own sub-domain of the shared platform host, addressed by its company slug:
 *
 *   https://{tenant}.bizneo.com/jobs        (candidate-facing open-roles board)
 *
 * The board's open-roles index is **server-rendered** enough to enumerate roles:
 * the `/jobs` page lists every open vacancy as an anchor of the form
 * `/jobs/{slug}` alongside labelled card text — the role title, a location line,
 * an optional brand label, and an "On-site" / "Remote" / "Hybrid" work-mode token.
 * Each role's per-job detail body is hydrated client-side, so rather than depend on
 * the JS-rendered detail DOM the adapter parses the server-rendered index and uses
 * the `{slug}` segment (the stable per-role token) as the ATS id, with the
 * canonical detail / apply URL `https://{tenant}.bizneo.com/jobs/{slug}`.
 *
 * The `{slug}` is a descriptive, URL-safe token (e.g.
 * `operario-a-almacen-aeropuerto-de-malaga`); some slugs carry a trailing UUID
 * (e.g. `…-01281ca3-125b-4a27-a690-4b1a47502c1c`). It is stable for the life of the
 * vacancy and is used verbatim as the ATS id. An unknown tenant (or one with no
 * open roles) renders an empty board, so it degrades naturally to an empty result.
 * A fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an
 * empty / partial result rather than throwing, so a single bad tenant never breaks
 * a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.bizneo.com/jobs`) and a
 *    real, named tenant on it: `groundforce` (Groundforce — airport handling, ES;
 *    `https://groundforce.bizneo.com/jobs`, multiple open roles rendering live with
 *    title + location + work-mode at time of research; verified=true).
 *  - Confirmed the per-role detail / apply URL shape
 *    `https://{tenant}.bizneo.com/jobs/{slug}` (e.g.
 *    `/jobs/operario-a-almacen-aeropuerto-de-malaga`,
 *    `/jobs/agentes-de-rampa-aeropuerto-de-bilbao-9821c8a8-1aca-4e1a-afd6-9ec384a509ef`).
 *    Another live tenant seen on the same host pattern: `telepizza`
 *    (Telepizza / Food Delivery Brands), reachable as `jobs.telepizza.bizneo.com`.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const BIZNEO_ROOT_DOMAIN = 'bizneo.com';

/**
 * Canonical public board host template. Keyed by the tenant company slug; the
 * `/jobs` index lists every open role with its canonical detail URL. This is the
 * scraping surface.
 */
export const BIZNEO_HOST_TEMPLATE = 'https://{tenant}.bizneo.com';

/** Public open-roles index path appended to the tenant host. */
export const BIZNEO_JOBS_PATH = '/jobs';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const BIZNEO_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The board renders the full
 * tenant open-roles list in a single document (with a client-side "load more"
 * control), so one page is the norm; the ceiling guards any future server-side
 * pagination.
 */
export const BIZNEO_MAX_PAGES = 50;

/** Default request headers. The board expects a browser-like UA + HTML Accept. */
export const BIZNEO_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Matches a Bizneo job-detail link inside the board HTML, capturing the `{slug}`
 * segment that follows `/jobs/`:
 *   /jobs/{slug}
 * The bare `/jobs` index itself (no trailing slug) carries no id and is skipped.
 * The slug stops at a quote, whitespace, query/hash, or a further path separator.
 */
export const BIZNEO_JOB_LINK_REGEX = /\/jobs\/([a-z0-9][a-z0-9._~-]*)(?=["'?#\s/]|$)/gi;

/**
 * Matches a schema.org `JobPosting` JSON-LD block, if the board emits one
 * server-side. Used as an optional enrichment over the index card text.
 */
export const BIZNEO_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Matches the document `<title>` (used as a defensive title fallback). */
export const BIZNEO_TITLE_TAG_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and work-mode fields. */
export const BIZNEO_REMOTE_REGEX =
  /\b(remote|remoto|teletrabajo|home[\s-]?(?:based|working|office)|work\s*from\s*home|wfh|telecommute|fully\s*remote|en\s*remoto)\b/i;
