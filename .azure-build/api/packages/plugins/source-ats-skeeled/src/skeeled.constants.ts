/**
 * Constants for the Skeeled talent-acquisition platform.
 *
 * Skeeled (skeeled.com) is a Luxembourg-based predictive talent-acquisition /
 * applicant-tracking platform. Each customer tenant publishes a public,
 * anonymous job board at:
 *
 *   https://app.skeeled.com/board/{boardId}
 *
 * where `{boardId}` is a 24-character hex ObjectId identifying the tenant's
 * board (e.g. `63ff6b1561114076fed6be2d`). Individual job offers live at:
 *
 *   https://app.skeeled.com/offer/c/{offerId}?show_description=true&language={lang}
 *
 * where `{offerId}` is a 24-character hex ObjectId (the public canonical id,
 * distinct from the internal `_id`).
 *
 * ## Verified public surface (live, 2026-06-03)
 *
 * The board page is a server-side-rendered (Nuxt 3 SSR) document. The full
 * offer catalogue is embedded in the page as a JSON data island:
 *
 *   <script type="application/json" id="__NUXT_DATA__"> [ … ] </script>
 *
 * The island is a *flattened reference array*: every value is either a
 * primitive or an integer index pointing at another array slot. Offer records
 * are dereferenced from this array. Each offer "wrapper" object has the shape
 * (after dereferencing):
 *
 *   {
 *     _id: "69b3c142c1f3cb2879705ba6",            // internal id
 *     url: { canonical: "https://app.skeeled.com/offer/c/69b3c143160b83099ff3ffb9" },
 *     presentation: { logo: { name: "CBL Logo", url: "…", _id: "…" } },
 *     information: {
 *       title:       { fr: "DEVISEUR" },           // i18n map (fr/nl/en/…)
 *       description: { fr: "<p>…</p>" },            // i18n HTML map
 *       address:     { country: "LU", city: "Niederkorn", postCode: "4578",
 *                      street: "Hahneboesch", number: "", timezone: "Europe/Luxembourg" },
 *       contract:    { type: "permanent_contract", hoursPerWeek: 40,
 *                      employmentTypes: ["full_time"] },
 *       jobCategory: "construction",
 *       salary:      { min: 60000, max: 90000, interval: "year" }
 *     }
 *   }
 *
 * Verified live 2026-06-03:
 *   - `GET https://app.skeeled.com/board/63ff6b1561114076fed6be2d`
 *     → HTTP 200, SSR HTML, 2 offers in `__NUXT_DATA__` (tenant "CBL s.a", LU).
 *   - `GET https://app.skeeled.com/board/62729efbe4a2052d5d569fcd`
 *     → HTTP 200, 44 offers (BE tenant, titles in fr/nl).
 *   - Offer canonical URL pattern confirmed: `…/offer/c/{offerId}`.
 *
 * The `_id` (internal) differs from the canonical offer id in the URL; the
 * canonical id is the public-facing one used as `atsId`. `title` and
 * `description` are i18n maps whose keys vary per tenant (fr / nl / en / de),
 * so a language-preference resolution is applied (requested → en → first
 * available). `contract` / `jobCategory` / `salary` may be null (sparse).
 *
 * ## Parsing strategy (layered, graceful degradation)
 *
 *   1. Primary — decode `__NUXT_DATA__`, dereference, and read structured
 *      offer wrappers (full title/description/address/contract).
 *   2. Fallback — if the data island is absent or unparseable, scrape the
 *      rendered offer cards directly: each `<a href="…/offer/c/{id}…">` card
 *      carries the title in a `.v-card-title.title` element. This yields a
 *      degraded record (title + url + atsId, no description) rather than zero.
 *
 * No authentication is required; the board and offer pages are fully public.
 * The authenticated REST API (`/api/…`, documented at
 * `app.skeeled.com/public/apidoc/`) needs credentials and is deliberately not
 * used.
 *
 * Tenant resolution: the board id is taken from `companySlug` (the 24-hex
 * board id), or extracted from a `companyUrl` of the form
 * `…/board/{boardId}` (or `…/offer/c/{offerId}` is rejected — that is an
 * offer, not a board).
 */

/** Shared host for every Skeeled-hosted tenant board and offer page. */
export const SKEELED_HOST = 'https://app.skeeled.com';

/** Path template for the public board page; `{board}` is substituted at runtime. */
export const SKEELED_BOARD_PATH_TEMPLATE = '/board/{board}';

/** Path template for the public offer detail page; `{offer}` is substituted at runtime. */
export const SKEELED_OFFER_PATH_TEMPLATE = '/offer/c/{offer}';

/**
 * Default query string appended to a built offer URL so the public page renders
 * the full description in the requested language.
 */
export const SKEELED_OFFER_QUERY = 'show_description=true';

/** Regex matching a 24-character hex ObjectId (board id or offer id). */
export const SKEELED_OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/** Regex extracting a board id from a `/board/{id}` URL path. */
export const SKEELED_BOARD_URL_RE = /\/board\/([a-f0-9]{24})/i;

/** Regex extracting an offer id from a `/offer/c/{id}` URL path. */
export const SKEELED_OFFER_URL_RE = /\/offer\/c\/([a-f0-9]{24})/i;

/** Id of the SSR JSON data island embedded in the board page. */
export const SKEELED_NUXT_DATA_ID = '__NUXT_DATA__';

/** CSS selector for an offer card anchor in the rendered board HTML (fallback path). */
export const SKEELED_OFFER_ANCHOR_SELECTOR = 'a[href*="/offer/c/"]';

/** CSS selector for the title text within an offer card (fallback path). */
export const SKEELED_CARD_TITLE_SELECTOR = '.v-card-title';

/**
 * Preferred language order when an offer's i18n title/description map does not
 * contain the caller-requested language. English first, then the common
 * Skeeled markets (French, Dutch, German).
 */
export const SKEELED_LANGUAGE_FALLBACKS = ['en', 'fr', 'nl', 'de'];

/** Default offer language requested when the caller does not specify one. */
export const SKEELED_DEFAULT_LANGUAGE = 'en';

/**
 * Default internal results cap. The public DTO default is smaller, but when a
 * caller omits `resultsWanted` entirely we ingest up to 100 of the tenant's
 * open roles.
 */
export const SKEELED_DEFAULT_RESULTS = 100;

/** Default request headers. The board page is plain SSR HTML; a browser-like UA is polite. */
export const SKEELED_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,nl;q=0.7',
};
