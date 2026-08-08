/**
 * Constants for the Concludis e-recruiting / applicant-tracking platform.
 *
 * Concludis (concludis.de) is a German e-recruiting and online application
 * management platform. Each customer tenant operates a branded public career
 * portal served from its own sub-domain under the shared apex `concludis.de`
 * (e.g. `https://hwk-stuttgart.concludis.de/`,
 * `https://smurfitkappa.concludis.de/`). Some tenants additionally publish the
 * same portal on a custom career domain that 302-redirects back to (or mirrors)
 * the `*.concludis.de` host.
 *
 * ── Public surface (anonymous, no auth) ──────────────────────────────────────
 *
 *   1. **Job listing page** — the portal root `GET https://{tenant}.concludis.de/`
 *      302-redirects to the canonical "all open positions" listing:
 *
 *        GET https://{tenant}.concludis.de/prj/lst/{listHash}/GesamtlisteOffenePositionen.htm
 *
 *      The bare `GET /prj/lst/` path also returns the same first page. The
 *      `{listHash}` value `a181a603769c1f98ad927e7367c7aa51` is the shared
 *      default "Gesamtliste offene Positionen" view and resolves on every tenant
 *      we tested; we nonetheless resolve the real listing URL by following the
 *      tenant-root redirect so a tenant with a custom default view still works.
 *
 *      The listing HTML is server-rendered (no client-side fetch needed). Open
 *      roles live in `div.stellen.list > div[id="line_{oid}"]`, each carrying:
 *        - `onclick="cJobboard.openJob('{detailUrl}')"` → canonical detail URL
 *        - `span.headerlink.stellenlink`               → job title
 *        - `span.kurzb`                                 → short teaser (HTML)
 *      A header `div.stellensum` reads "N Stellen gefunden" (total count).
 *      Pagination is via the `page` query param (`?page=2`), 25 rows per page.
 *
 *      The numeric `{oid}` (also the `line_{oid}` element id) is the stable
 *      per-tenant job id we use as the ATS id.
 *
 *   2. **Job detail page** — `GET {detailUrl}` where the URL pattern is:
 *
 *        https://{tenant}.concludis.de/prj/shw/{detailHash}_0/{oid}/{slug}.htm?b=0
 *
 *      When the tenant serves the detail page directly (HTTP 200) it embeds a
 *      schema.org JSON-LD block we parse for the rich fields:
 *
 *        <script type="application/ld+json">
 *        { "@context": "http://schema.org", "@type": "JobPosting",
 *          "datePosted": "2026-06-01",
 *          "title": "Mitarbeiter (m/w/d) Lehrlingsrolle",
 *          "description": "<p>…full HTML…</p>",
 *          "validThrough": "2026-06-30T23:59:59+02:00",
 *          "hiringOrganization": { "@type": "Organization",
 *            "name": "Handwerkskammer Region Stuttgart", "sameAs": "…", "logo": "…" },
 *          "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress",
 *            "addressLocality": "Stuttgart", "postalCode": "70191",
 *            "addressCountry": "DE", "streetAddress": "Heilbronner Straße 43" } },
 *          "employmentType": "FULL_TIME" }
 *        </script>
 *
 *      The detail fetch is **best-effort enrichment only**: some tenants
 *      302-redirect the `/prj/shw/…` URL to a custom domain or session-gate it
 *      (returning an empty body), and not every tenant embeds JSON-LD. When the
 *      detail fetch fails, is empty, or has no JSON-LD, we degrade gracefully to
 *      the listing-page teaser (`span.kurzb`) and a tenant-derived company name.
 *
 * ── Verification (live, 2026-06-03) ──────────────────────────────────────────
 *
 *   - `GET https://hwk-stuttgart.concludis.de/` → HTTP 302 →
 *     `/prj/lst/a181a603769c1f98ad927e7367c7aa51/GesamtlisteOffenePositionen.htm`
 *     → HTTP 200, 3 `div[id="line_*"]` rows, "3 Stellen gefunden".
 *   - `GET …/prj/shw/d2ed45a52bc0edfa11c2064e9edee8bf_0/932/…htm?b=0` → HTTP 200,
 *     valid JSON-LD `JobPosting` parsed (datePosted 2026-06-01, FULL_TIME,
 *     addressLocality "Stuttgart").
 *   - `GET https://smurfitkappa.concludis.de/prj/lst/…` → HTTP 200, 25 rows,
 *     "206 Stellen gefunden", `page=3` returns the next 25 rows.
 *   - `smurfitkappa` `/prj/shw/…` detail returned HTTP 302 (session/custom-domain
 *     gating) → confirms the need for best-effort detail enrichment + degradation.
 *
 * Tenant resolution: the sub-domain label is taken from `companySlug`, or
 * derived from the first sub-domain label of `companyUrl`
 * (e.g. `hwk-stuttgart` from `https://hwk-stuttgart.concludis.de/`). A custom
 * career domain supplied as `companyUrl` is used as-is (host + scheme).
 */

/** Shared apex for every Concludis-hosted tenant sub-domain. */
export const CONCLUDIS_APEX = 'concludis.de';

/** Host template for Concludis-hosted tenants; `{tenant}` is substituted at runtime. */
export const CONCLUDIS_HOST_TEMPLATE = 'https://{tenant}.concludis.de';

/**
 * Shared default "Gesamtliste offene Positionen" listing hash. Used to build a
 * deterministic listing URL when the tenant-root redirect cannot be followed.
 */
export const CONCLUDIS_DEFAULT_LIST_HASH = 'a181a603769c1f98ad927e7367c7aa51';

/**
 * Deterministic listing-page path built from the shared default view hash.
 * `{host}` is the resolved tenant host (scheme + host, no trailing slash).
 */
export const CONCLUDIS_LIST_PATH_TEMPLATE =
  '/prj/lst/' + CONCLUDIS_DEFAULT_LIST_HASH + '/GesamtlisteOffenePositionen.htm';

/** Bare listing path (returns the same first page as the hashed listing URL). */
export const CONCLUDIS_BARE_LIST_PATH = '/prj/lst/';

/** Query parameter that drives listing pagination (1-based). */
export const CONCLUDIS_PAGE_PARAM = 'page';

/** Number of job rows the listing renders per page (server-side). */
export const CONCLUDIS_PAGE_SIZE = 25;

/** Maximum number of detail-enrichment fetches issued concurrently per round. */
export const CONCLUDIS_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential pagination rounds, to stay polite. */
export const CONCLUDIS_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. When `resultsWanted` is omitted we ingest up to
 * this many of the tenant's open roles.
 */
export const CONCLUDIS_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on listing pages we will paginate through in a single run, to
 * bound work on very large tenants regardless of `resultsWanted`.
 */
export const CONCLUDIS_MAX_PAGES = 40;

/** CSS selector for a single job row in the listing page. */
export const CONCLUDIS_ROW_SELECTOR = 'div.stellen.list > div[id^="line_"]';

/** CSS selector for the job title inside a listing row. */
export const CONCLUDIS_TITLE_SELECTOR = 'span.headerlink.stellenlink';

/** CSS selector for the short teaser description inside a listing row. */
export const CONCLUDIS_TEASER_SELECTOR = 'span.kurzb';

/** CSS selector for the "N Stellen gefunden" total-count header. */
export const CONCLUDIS_COUNT_SELECTOR = 'div.stellensum';

/** Default request headers sent with every fetch. */
export const CONCLUDIS_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
};
