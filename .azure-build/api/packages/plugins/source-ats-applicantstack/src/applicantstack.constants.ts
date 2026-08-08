/**
 * Constants for the ApplicantStack (SwipeClock / WorkforceHub) applicant-tracking
 * careers platform.
 *
 * ApplicantStack (applicantstack.com, a US small/medium-business ATS owned by
 * SwipeClock / WorkforceHub) hosts every customer tenant's branded, public,
 * unauthenticated job board on its own sub-domain:
 *
 *   https://{tenant}.applicantstack.com/x/openings
 *
 * Unlike some sibling boards, the openings index is fully server-rendered: it is
 * an HTML `<table>` whose every body row is one open role, carrying all the
 * fields we need in a single document (so there is no per-job fetch required to
 * enumerate a tenant):
 *
 *   GET https://{tenant}.applicantstack.com/x/openings
 *     → text/html with a sortable listings table:
 *       <thead><tr>
 *         <th>Title</th><th>Date Posted</th>
 *         <th>Industry - Job Category</th><th>City</th>
 *       </tr></thead>
 *       <tbody>
 *         <tr class="oddrow">
 *           <td><a href="https://{tenant}.applicantstack.com/x/detail/{jobId}">{title}</a></td>
 *           <td>{MM/DD/YYYY}</td>
 *           <td>{industry - job category}</td>
 *           <td>{city}</td>
 *         </tr>
 *         …one row per open role…
 *       </tbody>
 *
 * Each role's server-rendered detail page carries the richer body + metadata:
 *
 *   GET https://{tenant}.applicantstack.com/x/detail/{jobId}
 *     → text/html with:
 *         <title>{title} - {company}</title>
 *         <meta property="og:title"       content="{company} - {title}">
 *         <meta property="og:description"  content="{title} at {company}">
 *         a "Job post summary" table of `<th>Label:</th><td class="noinput">value</td>`
 *           rows (Title / ID / Date Posted / Industry - Job Category / City), and
 *         <div class="listing_description">…full HTML job-ad body…</div>
 *       The apply form lives at `/x/apply/{jobId}`.
 *
 * The `{jobId}` is an opaque alphanumeric token (e.g. `a2v6venn6ji9`) and is the
 * stable per-role ATS id. The openings table already supplies the title, posted
 * date, industry/category and city for every role, so the adapter enumerates the
 * tenant from that one document and then fetches up to `resultsWanted` detail
 * pages to enrich each role with its full description body — there is no
 * server-side pagination of the job set beyond the table itself, so we slice
 * client-side to honour `resultsWanted`.
 *
 * The caller addresses a tenant by `companySlug` (the board sub-domain label,
 * e.g. `atwork443`) or by `companyUrl` (any board URL whose first sub-domain
 * label is the tenant). An unknown sub-domain (HTTP 4xx), a retired board (the
 * "job board you are looking for no longer exists" placeholder), a network
 * error, or a malformed page degrades to an empty / partial result rather than
 * throwing, so a single bad tenant never breaks a batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `https://atwork443.applicantstack.com/x/openings` → HTTP 200 text/html,
 *    sortable listings `<table>` with ~404 open-role rows (At Work Group), each
 *    `<td><a href="…/x/detail/{jobId}">{title}</a></td>` plus Date Posted,
 *    "Industry - Job Category" and City columns.
 *  - `https://atwork443.applicantstack.com/x/detail/a2v6venn6ji9` → HTTP 200 HTML
 *    for "Account Manager" with `og:title`/`og:description`, a "Job post summary"
 *    table (`<th>Title:</th>…`, `<th>ID:</th><td>56380612782CBH</td>`,
 *    `<th>Date Posted:</th><td>03/12/2026</td>`, `<th>City:</th><td>Riverside</td>`),
 *    and a `<div class="listing_description">` body; apply at `/x/apply/a2v6venn6ji9`.
 *  - Sibling tenants confirmed on the same `{tenant}.applicantstack.com/x/openings`
 *    host pattern: `jayco`, `qrm`, `fwcc`, `acesrch`, `solutionsbyfusion`.
 */

/** Canonical tenant job-board host template. */
export const APPLICANTSTACK_HOST_TEMPLATE = 'https://{tenant}.applicantstack.com';

/** Root career domain — used to recognise tenant hosts passed via `companyUrl`. */
export const APPLICANTSTACK_ROOT_DOMAIN = 'applicantstack.com';

/** Public, unauthenticated server-rendered openings index path (one table of roles). */
export const APPLICANTSTACK_OPENINGS_PATH = '/x/openings';

/** Per-role server-rendered detail-page path prefix. `{jobId}` is appended. */
export const APPLICANTSTACK_DETAIL_PATH = '/x/detail';

/** Per-role apply-form path prefix. `{jobId}` is appended. */
export const APPLICANTSTACK_APPLY_PATH = '/x/apply';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const APPLICANTSTACK_DEFAULT_RESULTS = 100;

/** Default request headers. The board expects a browser-like UA. */
export const APPLICANTSTACK_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches a single `<tr>…</tr>` row of the openings table (case-insensitive,
 * dot-all). Used to split the listings table into per-role chunks before
 * extracting each row's cells.
 */
export const APPLICANTSTACK_ROW_REGEX = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

/**
 * Matches the role's detail anchor inside a table row, capturing the opaque
 * alphanumeric `{jobId}` and the link text (the job title). Only `/x/detail/…`
 * anchors are roles; header / pager / facet links are skipped.
 */
export const APPLICANTSTACK_DETAIL_LINK_REGEX =
  /<a\b[^>]*href=["'][^"']*\/x\/detail\/([A-Za-z0-9]+)["'][^>]*>([\s\S]*?)<\/a>/i;

/**
 * Captures the opaque `{jobId}` from any absolute or relative `/x/detail/{id}`
 * URL (used to validate / normalise links and to derive the apply URL).
 */
export const APPLICANTSTACK_DETAIL_ID_REGEX = /\/x\/detail\/([A-Za-z0-9]+)/i;

/** Matches the inner text of a `<td>…</td>` cell (used to read the row's columns). */
export const APPLICANTSTACK_CELL_REGEX = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;

/**
 * Extracts a single "Job post summary" field row from a detail page, e.g.
 * `<th>ID:</th><td class="noinput">56380612782CBH</td>`. `{label}` is substituted
 * per field at build time; the trailing colon on the label is optional.
 */
export const APPLICANTSTACK_SUMMARY_FIELD_TEMPLATE =
  '<th[^>]*>\\s*{label}\\s*:?\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>';

/** Extracts the full HTML job-ad body from the detail page's listing block. */
export const APPLICANTSTACK_DESCRIPTION_REGEX =
  /<div[^>]*class=["'][^"']*listing_description[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class=["'][^"']*(?:listing_|apply|footer|sectionhead)|<\/div>\s*<\/div>)/i;

/** Extracts a `<meta property="og:…" content="…">` value (title / description). */
export const APPLICANTSTACK_OG_TITLE_REGEX =
  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;
export const APPLICANTSTACK_OG_DESCRIPTION_REGEX =
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']\s*\/?>/i;
export const APPLICANTSTACK_OG_SITE_NAME_REGEX =
  /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i;

/** Extracts the page `<title>` (`"{title} - {company}"`) as a company / title fallback. */
export const APPLICANTSTACK_TITLE_TAG_REGEX = /<title>([\s\S]*?)<\/title>/i;

/**
 * Detects a retired / removed tenant board. ApplicantStack serves a generic
 * "the job board you are looking for no longer exists" placeholder (HTTP 200)
 * for disabled boards; we treat that as "no jobs" rather than a parse failure.
 */
export const APPLICANTSTACK_BOARD_GONE_REGEX = /job board you are looking for no longer exists/i;

/** Detects remote / work-from-home roles across the common US phrasings. */
export const APPLICANTSTACK_REMOTE_REGEX =
  /\b(remote|work\s*from\s*home|telecommute|wfh|virtual|home[\s-]?based)\b/i;
