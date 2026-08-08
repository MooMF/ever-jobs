/**
 * Constants for the Varbi applicant-tracking / recruitment platform.
 *
 * Varbi (varbi.com, "Grade Varbi Recruit") is a Swedish recruitment / ATS
 * platform widely used by universities, public-sector employers and private
 * companies across the Nordics and beyond. Every customer tenant publishes a
 * branded, public, unauthenticated career page on its own sub-domain:
 *
 *   GET https://{tenant}.varbi.com/en/
 *
 * The career page renders the tenant's open roles as a single server-rendered
 * HTML table (one `<tr>` per vacancy) — there is no server-side pagination, so
 * one fetch yields the complete open-roles list and we slice client-side to
 * honour `resultsWanted`. Each row links to a public job-ad page:
 *
 *   GET https://{tenant}.varbi.com/en/what:job/jobID:{jobID}/
 *
 * The job-ad page carries the full advert body in a `<div class="job-desc">`
 * block plus `og:` meta (`og:title`, `og:url`, `og:description`, `og:image`),
 * and a public apply URL of the form
 * `https://{tenant}.varbi.com/se/apply/positionquick/{jobID}/`.
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g.
 * `kth`, `lu`, `uu`, `su`, `vgregion`) or by an explicit `companyUrl`. An
 * unknown sub-domain (HTTP 404 / 4xx) or a malformed page degrades to an empty
 * (graceful) result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * Verified live 2026-06-03 (no authentication, browser-like UA):
 *  - `GET https://kth.varbi.com/en/` → HTTP 200 HTML listing 60+ open roles,
 *    each row `<td class="...pos-title"><a href=".../what:job/jobID:935474/">…</a>`
 *    plus `pos-town` (city), `pos-subcompany` (company / department) and
 *    `pos-ends` (application deadline, `YYYY-MM-DD`).
 *  - `GET https://kth.varbi.com/en/what:job/jobID:935474/` → HTTP 200 job ad
 *    with `<div class="job-desc mb">…full HTML body…</div>`,
 *    `<meta property="og:description" …>` and apply link
 *    `https://kth.varbi.com/se/apply/positionquick/935474/`.
 *  - Other live tenants observed: `lu`, `su`, `uu`, `vgregion`, `sem`,
 *    `career`. Unknown sub-domains return HTTP 404.
 */

/** Canonical tenant career-page host template. */
export const VARBI_HOST_TEMPLATE = 'https://{tenant}.varbi.com';

/** Public, unauthenticated English career-listing path for a tenant. */
export const VARBI_LISTING_PATH = '/en/';

/**
 * Public job-ad detail path. `{jobID}` is the numeric Varbi vacancy id captured
 * from the listing rows.
 */
export const VARBI_JOB_PATH_TEMPLATE = '/en/what:job/jobID:{jobID}/';

/**
 * Public apply path template. `{jobID}` is the numeric Varbi vacancy id. Mirrors
 * the `Sök jobbet` / apply button observed on the job-ad page.
 */
export const VARBI_APPLY_PATH_TEMPLATE = '/se/apply/positionquick/{jobID}/';

/** ATS type tag stamped onto every emitted JobPostDto. */
export const VARBI_ATS_TYPE = 'varbi';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller
 * omits `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const VARBI_DEFAULT_RESULTS = 100;

/**
 * Hard cap on the number of per-job description fetches performed in one run.
 * The listing is one fetch; description enrichment costs one extra fetch per
 * role, so we bound it to the (already sliced) result set to stay
 * performance-minded and never fan out unboundedly for a huge tenant.
 */
export const VARBI_MAX_DETAIL_FETCHES = 100;

/** Default request headers. Varbi serves HTML to a browser-like UA. */
export const VARBI_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches a single listing-table row's job-ad reference, capturing the numeric
 * `jobID`. Rows repeat the same href across the title / town / deadline cells,
 * so callers must de-duplicate by the captured id.
 */
export const VARBI_JOB_ID_REGEX = /what:job\/jobID:(\d+)\b/g;

/**
 * Matches an individual listing `<tr>…</tr>` block so each vacancy's cells can
 * be parsed in isolation. Non-greedy, `s`-flag so `.` spans newlines.
 */
export const VARBI_ROW_REGEX = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

/** Captures the title-cell anchor text within a row (`pos-title`). */
export const VARBI_TITLE_REGEX =
  /class="[^"]*pos-title[^"]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i;

/** Captures the town/city-cell anchor text within a row (`pos-town`). */
export const VARBI_TOWN_REGEX =
  /class="[^"]*pos-town[^"]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i;

/** Captures the company/department-cell text within a row (`pos-subcompany`). */
export const VARBI_SUBCOMPANY_REGEX =
  /class="[^"]*pos-subcompany[^"]*"[^>]*>([\s\S]*?)<\/td>/i;

/** Captures the application-deadline date within a row (`pos-ends`, `YYYY-MM-DD`). */
export const VARBI_ENDS_REGEX = /class="[^"]*pos-ends[^"]*"[\s\S]*?(\d{4}-\d{2}-\d{2})/i;

/** Captures the job-ad body HTML block on a detail page (`job-desc`). */
export const VARBI_JOB_DESC_REGEX = /<div class="job-desc[^"]*">([\s\S]*?)<\/div>\s*(?:<\/div>|<footer|<script|$)/i;

/** Captures an `og:` meta property's content value (e.g. `og:description`). */
export const VARBI_OG_META_REGEX_TEMPLATE =
  '<meta\\s+property="og:{prop}"\\s+content="([^"]*)"';

/**
 * Captures the page `<title>` so a fallback company name can be derived from
 * Varbi's "Vacancies at {Company}" / "Lediga jobb hos {Company}" heading.
 */
export const VARBI_PAGE_TITLE_REGEX = /<title>([\s\S]*?)<\/title>/i;
