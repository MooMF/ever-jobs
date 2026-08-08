/**
 * Constants for the Recruiteze careers platform.
 *
 * Recruiteze (recruiteze.com — a US SMB applicant-tracking system / recruiting software used
 * by hundreds of small businesses and staffing agencies) hosts a branded, public,
 * unauthenticated candidate-facing career portal for every customer tenant on its own
 * sub-domain of the shared host, addressed by the tenant's chosen company sub-domain label:
 *
 *   https://{tenant}.recruiteze.com/Jobs/AllJobs                       (branded careers board)
 *   https://{tenant}.recruiteze.com/Jobs/AllJobsEmbed                  (iframe-embed variant)
 *   https://{tenant}.recruiteze.com/jobs/jobdetail?id={encryptedId}    (per-role public page)
 *
 * The board itself is an ASP.NET MVC page whose role list is rendered client-side by a
 * jQuery DataTables grid. That grid loads its rows from a **public, anonymous** server-side
 * DataTables endpoint on the same host (no bearer token, no cookie, no API key):
 *
 *   POST https://{tenant}.recruiteze.com/Jobs/LoadFilteredJobs
 *     body (form-encoded): companyId={token}&stateId=0&jobTypeId=0&appId=&custom=
 *                          &draw={n}&start={offset}&length={pageSize}&search[value]=…
 *     → JSON DataTables envelope:
 *       { "draw": n, "recordsTotal": N, "recordsFiltered": N,
 *         "data": [ { …role… } ] }
 *
 * where the `companyId` is an opaque, per-tenant **encrypted token** the career page renders
 * into a hidden `#hdnCompanyID` input (e.g. `8RhggVIrTZ8wPYlGstD7LA==`). The adapter first
 * GETs the tenant's `/Jobs/AllJobs` page to harvest that token, then POSTs `LoadFilteredJobs`
 * to drain the role grid — rather than depending on the client-rendered DOM or a headless
 * browser. Each `data[]` role carries a numeric `ID` / `RecruitezeID`, a `JobTitle`, a
 * `Location` / `LocationWithComma` / `City` / `State`, a `Snippet` (description excerpt), a
 * `PostedDate` (e.g. `30 Jan 2025`), and a `Url` — the canonical public detail / apply page
 * (`/jobs/jobdetail?id={encryptedId}`).
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g. `spearmc`) or
 * by `companyUrl` (a career-site URL on a `recruiteze.com` host whose leading sub-domain
 * label is the tenant). An unknown tenant, a tenant with no open roles, or an empty board
 * degrades naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, a
 * missing company token, or a malformed body degrades to an empty / partial result rather
 * than throwing, so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.recruiteze.com/Jobs/AllJobs`) and
 *    real, named tenants on it: `spearmc` (SpearMC Consulting — 9 live roles),
 *    `allianceepc` (Alliance Engineers & Project Consultants), `mobility4all` (Mobility4All),
 *    `infostructures` (InfoStructures, Inc.), `augustineinstitute` (Augustine Institute).
 *  - Confirmed the public DataTables endpoint `POST /Jobs/LoadFilteredJobs` returns the
 *    `{ draw, recordsTotal, recordsFiltered, data }` envelope. For `spearmc` it returned 9
 *    live roles, each carrying a numeric `ID` (e.g. `15293`), a `JobTitle`
 *    (`Grants/PPM Lead for PeopleSoft to Oracle Cloud Migration`), a `Location`
 *    (`Remote/California`) + `City`/`State`, a `Snippet`, a `PostedDate` (`30 Jan 2025`), and
 *    a `Url` `https://SpearMC.recruiteze.com/jobs/jobdetail?id=urbC%2ftDVyBjlfvk6Aeq5fg%3d%3d`.
 *  - Confirmed the per-tenant encrypted `companyId` token is rendered into the hidden
 *    `#hdnCompanyID` input on `/Jobs/AllJobs` (e.g. `spearmc` → `8RhggVIrTZ8wPYlGstD7LA==`,
 *    `allianceepc` → `olfnCQ6yuy5CRRnPWrVw0g==`, `mobility4all` → `FmDrMk5wVnZ8uphAwrFdUg==`).
 *    verified=true.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const RECRUITEZE_ROOT_DOMAIN = 'recruiteze.com';

/** Hosted careers host suffix — tenant sites live at `{tenant}.recruiteze.com`. */
export const RECRUITEZE_CAREER_HOST_SUFFIX = '.recruiteze.com';

/** Builds a tenant's career-site origin from its slug. */
export const recruitezeCareerOrigin = (tenant: string): string =>
  `https://${tenant}${RECRUITEZE_CAREER_HOST_SUFFIX}`;

/**
 * Public career-board page path on the tenant host. The adapter GETs this page once to
 * harvest the per-tenant encrypted `companyId` token from its hidden `#hdnCompanyID` input.
 */
export const RECRUITEZE_BOARD_PATH = 'Jobs/AllJobs';

/**
 * Public, anonymous server-side DataTables endpoint the board grid POSTs to for its rows.
 * Returns a `{ draw, recordsTotal, recordsFiltered, data }` JSON envelope.
 */
export const RECRUITEZE_JOBS_PATH = 'Jobs/LoadFilteredJobs';

/**
 * Regex that extracts the per-tenant encrypted `companyId` token from the career page's
 * hidden input `<input id="hdnCompanyID" … value="{token}" />`. The token is an opaque,
 * URL-safe-ish base64 string (e.g. `8RhggVIrTZ8wPYlGstD7LA==`).
 */
export const RECRUITEZE_COMPANY_ID_REGEX = /id="hdnCompanyID"[^>]*\bvalue="([^"]*)"/i;

/**
 * Page size requested per DataTables page (`length`). Large enough that a typical SMB board
 * drains in a single page, with pagination drained defensively for larger boards.
 */
export const RECRUITEZE_PAGE_SIZE = 100;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const RECRUITEZE_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on DataTables pages fetched per scrape. The page size is large enough that
 * most tenants fit in one page; the ceiling guards against an unbounded / looping pager
 * (8 × 100 = 800 roles, well beyond any SMB board).
 */
export const RECRUITEZE_MAX_PAGES = 8;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive Recruiteze career
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well under
 * a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const RECRUITEZE_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The board page wants a browser UA; the grid endpoint wants JSON. */
export const RECRUITEZE_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/javascript, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Detects remote / home-working roles across the title and location fields. Recruiteze
 * commonly encodes remote roles in the location (e.g. `Remote/California`,
 * `Remote, California`) rather than a structured flag.
 */
export const RECRUITEZE_REMOTE_REGEX =
  /\b(remote|home[\s-]?office|telecommute|teleworking|wfh|work\s*from\s*home|fully\s*remote|anywhere)\b/i;
