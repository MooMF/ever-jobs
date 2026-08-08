/**
 * Constants for the BrassRing (IBM Kenexa / Infinite BrassRing) ATS platform.
 *
 * BrassRing is an enterprise applicant-tracking system whose candidate-facing
 * "Talent Gateway" portals are all hosted under the shared host
 * `sjobs.brassring.com` (a handful of tenants on the regional mirror
 * `krb-sjobs.brassring.com` / `jobs.brassring.com`). A tenant is NOT addressed by
 * a sub-domain or a slug path — it is addressed by a **`partnerid` + `siteid`
 * pair** carried as query parameters, e.g.:
 *
 *   https://sjobs.brassring.com/TGnewUI/Search/Home/Home?partnerid={P}&siteid={S}
 *
 * The portal's jobs index is a client-rendered single-page app (the "TGnewUI"
 * Angular app), so the listing page carries no server-side job links. The stable,
 * crawlable public surface is the app's own AJAX search endpoint, which returns a
 * JSON envelope of matched roles:
 *
 *   POST https://sjobs.brassring.com/TgNewUI/Search/Ajax/MatchedJobs
 *     body: { partnerId, siteId, keyword, location, pageNumber, sortField, ... }
 *     → { Jobs: [ { Title, Jobid, JobUrl, Location, PostingDate, … } ],
 *         JobsCount, Facets, SortFields, … }
 *
 *   POST https://sjobs.brassring.com/TgNewUI/Search/Ajax/ProcessSortAndShowMoreJobs
 *     → same envelope, used by the portal to page / "show more".
 *
 * Each role's server-rendered detail page is addressed by the requisition id
 * (`Areq`, a `…BR`-suffixed Kenexa requisition number) on the same shared host:
 *
 *   GET https://sjobs.brassring.com/TGnewUI/Search/home/HomeWithPreLoad
 *         ?PageType=JobDetails&partnerid={P}&siteid={S}&Areq={req}
 *     → HTML; many tenants pre-render a schema.org `JobPosting` JSON-LD block for
 *       Google-for-Jobs which the parser reads when present.
 *
 * The MatchedJobs envelope returns a page of roles plus a `JobsCount` total, so we
 * page client-side (bounded by `resultsWanted`) to ingest the tenant's open roles.
 * An unknown tenant (`partnerid`/`siteid` pair that 4xx's or yields zero roles), a
 * missing/empty envelope, or a malformed role degrades to an empty (graceful)
 * result rather than throwing, so a single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication):
 *  - Confirmed the shared host + tenant addressing model (`partnerid` + `siteid`
 *    query params on `sjobs.brassring.com`) and real, named tenants on it:
 *    AAFES (`partnerid=25212&siteid=5164`), Peace Corps (`25332`/`5414`),
 *    U.S. Steel (`25307`/`5238`), Fairfax County Public Schools (`25103`/`5041`),
 *    Archer Daniels Midland (`25416`/`5998`). Confirmed the AJAX listing endpoint
 *    `POST /TgNewUI/Search/Ajax/MatchedJobs` and that its JSON envelope carries a
 *    `Jobs` array + `JobsCount` (plus `Facets`, `SortFields`). Confirmed the
 *    `PageType=JobDetails&…&Areq={req}` detail-page URL pattern.
 *  - The portal is a JS-rendered SPA, so the exact per-role field names inside the
 *    `Jobs[]` array could NOT be confirmed via an unauthenticated no-JS fetch. The
 *    parser is written defensively around the documented envelope, tolerating the
 *    common BrassRing/Kenexa field-name spellings (verified=false).
 */

/** Canonical shared host for BrassRing Talent Gateway portals. */
export const BRASSRING_HOST = 'https://sjobs.brassring.com';

/** Root portal domain — used to recognise BrassRing hosts passed via `companyUrl`. */
export const BRASSRING_ROOT_DOMAIN = 'brassring.com';

/** Public, unauthenticated AJAX endpoint returning a page of matched roles. */
export const BRASSRING_MATCHED_JOBS_PATH = '/TgNewUI/Search/Ajax/MatchedJobs';

/** AJAX endpoint the portal uses to page / "show more" (same JSON envelope). */
export const BRASSRING_SHOW_MORE_PATH = '/TgNewUI/Search/Ajax/ProcessSortAndShowMoreJobs';

/** Server-rendered per-role detail page, addressed by `partnerid`/`siteid`/`Areq`. */
export const BRASSRING_JOB_DETAILS_PATH = '/TGnewUI/Search/home/HomeWithPreLoad';

/** Public Talent Gateway landing path, used to build a human-facing portal URL. */
export const BRASSRING_HOME_PATH = '/TGnewUI/Search/Home/Home';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const BRASSRING_DEFAULT_RESULTS = 100;

/** Page size requested from the MatchedJobs endpoint per round. */
export const BRASSRING_PAGE_SIZE = 25;

/** Hard cap on AJAX pages walked per tenant (defence against runaway paging). */
export const BRASSRING_MAX_PAGES = 20;

/** Default request headers. The AJAX endpoint expects a browser-like, JSON UA. */
export const BRASSRING_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Content-Type': 'application/json; charset=UTF-8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Extracts every `<script type="application/ld+json">…</script>` block's inner
 * JSON text from a detail page. A page may carry several JSON-LD blocks
 * (Organization, BreadcrumbList, JobPosting); we scan them all for the
 * `JobPosting` object.
 */
export const BRASSRING_JSONLD_REGEX =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Detects remote / work-from-home roles across the title, location, and body text. */
export const BRASSRING_REMOTE_REGEX =
  /\b(remote|work\s*from\s*home|wfh|telecommute|virtual|home[\s-]?based|fully\s*remote)\b/i;

/** Strips HTML tags when only a marked-up description blob is available. */
export const BRASSRING_HTML_TAG_REGEX = /<[^>]+>/g;
