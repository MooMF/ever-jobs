/**
 * Constants for the Taleez (taleez.com, France) recruitment platform.
 *
 * Taleez is a French applicant-tracking system (ATS) / recruitment software for SMEs
 * and mid-market companies. Every customer tenant publishes a branded, public,
 * unauthenticated candidate-facing careers board on the shared host, addressed by
 * its tenant token in one of two equivalent forms:
 *
 *   https://{tenant}.taleez.com/                (tenant sub-domain board — primary)
 *   https://taleez.com/careers/{tenant}         (path-form board — alias of the above)
 *
 * Both board forms are server-rendered HTML shells whose open-roles *list* is
 * client-rendered (an Angular SPA), so the board document itself carries no role
 * anchors. Each role's **detail / apply page**, however, is fully server-rendered
 * and public:
 *
 *   GET https://taleez.com/apply/{slug}
 *     → server-rendered detail HTML embedding a schema.org `JobPosting` JSON-LD block
 *       and `og:` meta. The JSON-LD carries `title`, `description` (HTML body),
 *       `qualifications` (HTML), `identifier` (a `PropertyValue` whose `name` is the
 *       tenant brand and whose `value` is the role `{slug}` — the stable ATS id),
 *       `datePosted` (ISO 8601), `employmentType` (e.g. `["FULL_TIME"]`),
 *       `hiringOrganization.name` (the tenant brand), and `jobLocationType`
 *       (`TELECOMMUTE` for remote). The application form lives at `…/apply/{slug}/applying`.
 *
 * Because the board's role list is rendered client-side (and the authenticated Taleez
 * data API at `https://api.taleez.com/0/jobs` answers 403 to anonymous callers), the
 * adapter enumerates the canonical `https://taleez.com/apply/{slug}` anchors from the
 * board HTML when Taleez server-renders them, deduping by `{slug}`, then fetches each
 * detail page and parses its JSON-LD (with `og:` / `<title>` / body fallbacks). A
 * caller may also address a single role directly via a `companyUrl` that is itself an
 * `…/apply/{slug}` URL. A board with no harvestable anchors (the common SPA case)
 * degrades naturally to an empty result; an unknown tenant (HTTP 4xx), a DNS failure,
 * or a malformed body degrades to an empty / partial result rather than throwing, so
 * a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing: the sub-domain board
 *    `https://{tenant}.taleez.com/` and the path-form alias
 *    `https://taleez.com/careers/{tenant}`, with a real, named live tenant on it:
 *    `tehtris` (TEHTRIS, a European cybersecurity firm — `https://tehtris.taleez.com/`,
 *    HTTP 200). Other live tenants seen: `oversight`, `at-home`, `sce`, `reseauad`,
 *    `grandannecy`, `cerfrance-bfc`, and the path-form `ufcv-emploi`.
 *  - Confirmed the per-role detail / apply surface `https://taleez.com/apply/{slug}`
 *    is server-rendered with a schema.org `JobPosting` JSON-LD block and `og:` meta
 *    (verified=true), e.g. `…/apply/mdr-analyst-niveau-3-f-m-x-tehtris-cdi`, whose
 *    JSON-LD `identifier.value` is the role `{slug}` (the stable ATS id). JSON-LD /
 *    `og:` parsing is written defensively around that documented detail surface.
 */

/** Canonical public host (path-form board + per-role detail / apply pages). */
export const TALEEZ_BASE = 'https://taleez.com';

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const TALEEZ_ROOT_DOMAIN = 'taleez.com';

/** Path segment of the path-form careers board (`https://taleez.com/careers/{tenant}`). */
export const TALEEZ_CAREERS_PATH = '/careers/';

/** Path segment of the per-role detail / apply page (`https://taleez.com/apply/{slug}`). */
export const TALEEZ_APPLY_PATH = '/apply/';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const TALEEZ_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on board pages fetched per scrape. The board renders its role list in
 * a single document (the SPA loads everything client-side), so one page is the norm;
 * the ceiling guards any future server-side pagination of the board.
 */
export const TALEEZ_MAX_PAGES = 50;

/** Default request headers. The board / detail pages expect a browser-like UA + HTML Accept. */
export const TALEEZ_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
};

/**
 * Matches a canonical Taleez detail / apply anchor inside the board HTML, capturing
 * the role slug:  https://taleez.com/apply/{slug}  (the optional `/applying` suffix
 * and any query / fragment are excluded). The `{slug}` is the stable ATS id.
 */
export const TALEEZ_APPLY_LINK_REGEX =
  /https?:\/\/(?:www\.)?taleez\.com\/apply\/([a-z0-9][a-z0-9-]*)/gi;

/**
 * Matches a `<script type="application/ld+json">…</script>` block (lazy, dot-all) so
 * the adapter can recover the schema.org `JobPosting` payload from a detail page.
 */
export const TALEEZ_JSONLD_REGEX =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts an `og:` / meta property's content attribute from the detail HTML. */
export const TALEEZ_OG_TITLE_REGEX =
  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const TALEEZ_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i;
export const TALEEZ_OG_URL_REGEX =
  /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i;

/** Extracts the `<title>` text as a last-resort title fallback. */
export const TALEEZ_TITLE_TAG_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and type fields. */
export const TALEEZ_REMOTE_REGEX =
  /\b(remote|t[ée]l[ée]travail|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
