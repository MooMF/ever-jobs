/**
 * Constants for the Sympa careers platform.
 *
 * Sympa (sympa.com — a Nordic, Finland-origin HR suite with a built-in recruitment module)
 * publishes a branded, public, unauthenticated candidate-facing careers site for every customer
 * tenant. Each tenant board is addressed by a per-tenant **careers slug** on the shared hosted
 * careers domain Sympa's recruitment product serves boards from:
 *
 *   https://{slug}.recruitee.com/                 (branded employer careers board)
 *   https://{slug}.recruitee.com/o/{offerSlug}    (per-role public detail / apply page)
 *
 * The candidate-facing board is a client-rendered site backed by a **single public, anonymous
 * JSON offers feed** the board itself consumes (no bearer token, no API key — the feed responds
 * 200 to any anonymous visitor):
 *
 *   GET https://{slug}.recruitee.com/api/offers/
 *     → { "offers": [ { …role… } ] }
 *
 * The feed returns the tenant's full published-offer set in one envelope (it is not paginated
 * via query cursors — the board renders the whole `offers` array client-side), so the adapter
 * GETs it once and slices client-side to `resultsWanted`. Each `offers[]` role carries a numeric
 * `id` (the stable ATS id), a `slug`, a `title`, a `status` (`published` for live roles), a
 * `careers_url` (the canonical public detail page) and a `careers_apply_url` (the apply page),
 * structured `city` / `state_name` / `country` / `country_code` plus a free-text `location`, a
 * `department`, an `employment_type_code` (e.g. `fulltime_permanent`), boolean `remote` /
 * `hybrid` / `on_site` work-model flags, ISO-ish `created_at` / `published_at` timestamps, a
 * `description` and `requirements` body (HTML), a `company_name`, and a per-role `mailbox_email`.
 *
 * The adapter resolves the tenant slug from `companySlug` or from a `companyUrl` on a
 * `*.recruitee.com` host, GETs the offers feed once, keeps only `published` roles, and maps
 * each — rather than depending on a client-rendered DOM, a headless browser, or any
 * authenticated Sympa API. An unknown tenant (the host answers HTTP 404), an empty board, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a single bad
 * tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-04, no authentication):
 *  - Confirmed the platform + slug addressing (per-tenant `{slug}.recruitee.com`) and the
 *    public, anonymous offers feed `GET /api/offers/` baked into the board's client bundle.
 *  - Confirmed `GET https://sympa.recruitee.com/api/offers/` returns `{ "offers": [] }`
 *    anonymously (Sympa's own live tenant with no currently-open roles — drains to an empty
 *    result), and that an unknown tenant host answers HTTP 404.
 *  - Confirmed a populated tenant returns `{ "offers": [ { "id": <number>, "slug": "…",
 *    "title": "…", "status": "published", "careers_url": "https://…/o/…",
 *    "careers_apply_url": "https://…/o/…/c/new", "city": "…", "country": "…",
 *    "country_code": "…", "location": "…", "department": "…",
 *    "employment_type_code": "fulltime_permanent", "remote": false, "hybrid": true,
 *    "created_at": "YYYY-MM-DD HH:MM:SS UTC", "published_at": "YYYY-MM-DD HH:MM:SS UTC",
 *    "description": "<p>…</p>", "company_name": "…" } ] }` anonymously (e.g. an active tenant
 *    returning all open roles in a single envelope). verified=true.
 */

/**
 * Root careers domain — tenant boards live at `{slug}.recruitee.com` (the hosted careers domain
 * Sympa's recruitment product serves boards from). Used to recognise tenant URLs passed via
 * `companyUrl` and to build the per-tenant feed origin.
 */
export const SYMPA_CAREERS_ROOT_DOMAIN = 'recruitee.com';

/** Marketing / product root domain (informational — not used to address tenant boards). */
export const SYMPA_ROOT_DOMAIN = 'sympa.com';

/** Builds a tenant board origin (`https://{slug}.recruitee.com`) for a careers slug. */
export const sympaBoardOrigin = (slug: string): string =>
  `https://${encodeURIComponent(slug)}.${SYMPA_CAREERS_ROOT_DOMAIN}`;

/** Path of the public, anonymous offers feed on a tenant board origin. */
export const SYMPA_OFFERS_PATH = '/api/offers/';

/** Builds the public, anonymous offers-feed URL for a tenant careers slug. */
export const sympaOffersUrl = (slug: string): string =>
  `${sympaBoardOrigin(slug)}${SYMPA_OFFERS_PATH}`;

/** Builds a per-role public detail-page URL on a tenant board origin (fallback derivation). */
export const sympaOfferDetailUrl = (slug: string, offerSlug: string): string =>
  `${sympaBoardOrigin(slug)}/o/${encodeURIComponent(offerSlug)}`;

/**
 * The `status` token the feed emits for live, candidate-facing roles. The adapter keeps only
 * offers in this state (a tenant board may also carry closed / draft roles in other states).
 */
export const SYMPA_PUBLISHED_STATUS = 'published';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const SYMPA_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on offers read per scrape. The feed returns the tenant's full open-role set in a
 * single envelope (no query pagination), so this guards against a pathologically large board
 * rather than a pager; the adapter slices the in-memory `offers` array to this ceiling before
 * mapping, and ultimately to `resultsWanted`.
 */
export const SYMPA_MAX_OFFERS = 1000;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive tenant host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds in well under a second. A caller may
 * request a SHORTER timeout — we only bound the upper end.
 */
export const SYMPA_DEFAULT_TIMEOUT_SECONDS = 15;

/**
 * Default request headers. The board's own client requests the feed with a browser-like UA and
 * a JSON Accept; mirroring keeps us on the public anonymous path.
 */
export const SYMPA_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Detects remote / home-working roles across the title, location, and department fields,
 * complementing the structured `remote` / `hybrid` work-model flags the feed emits.
 */
export const SYMPA_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere|etätyö|distans)\b/i;
