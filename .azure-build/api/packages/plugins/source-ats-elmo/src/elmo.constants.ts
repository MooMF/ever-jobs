/**
 * Constants for the ELMO careers platform.
 *
 * ELMO (elmosoftware.com.au — formerly elmotalent.com.au, Australia / NZ / APAC) is an
 * Australian HR + recruitment / talent-management suite. Every customer tenant publishes
 * a branded, public, unauthenticated candidate-facing career board on its own sub-domain
 * of the shared hosted talent host, addressed by its company slug:
 *
 *   https://{tenant}.elmotalent.com.au/careers/{board}              (open-roles index, AU)
 *   https://{tenant}.elmotalent.co.nz/careers/{board}               (open-roles index, NZ)
 *
 * The open-roles index is a server-rendered HTML page that lists the tenant's open roles
 * inline; each role row links to its canonical candidate-facing detail page:
 *
 *   https://{tenant}.elmotalent.com.au/careers/{board}/job/view/{jobId}
 *
 * and the apply page:
 *
 *   https://{tenant}.elmotalent.com.au/careers/{board}/job/apply/{jobId}
 *
 * The numeric `{jobId}` in the `/job/view/{jobId}` URL is the stable per-role ATS id.
 * The `{board}` segment is the tenant's career-board name (often the tenant slug itself,
 * e.g. `careers`, or a brand label like `ekservices`); the adapter probes a small set of
 * likely board segments per tenant until one renders a role list, and remembers the
 * board that served the index for URL building.
 *
 * The adapter scrapes the server-rendered listing HTML (anchoring on the
 * `/job/view/{jobId}` links rather than on volatile CSS class names), so no headless
 * browser and no authenticated API is required. An unknown tenant, a tenant with no open
 * roles, an empty board, a 302-redirect off the board to the ELMO marketing site, or a
 * malformed body all degrade naturally to an empty / partial result rather than throwing,
 * so a single bad tenant never nukes a batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication; verified=false):
 *  - Confirmed the platform + tenant addressing scheme: customers are provisioned on
 *    `{tenant}.elmotalent.com.au` (AU) and `{tenant}.elmotalent.co.nz` (NZ), with the
 *    public career board under `/careers/{board}` (e.g.
 *    `https://securecorp.elmotalent.com.au/careers/SECUREcorp`,
 *    `https://anzca.elmotalent.com.au/`).
 *  - Confirmed the canonical per-role detail URL shape
 *    `/careers/{board}/job/view/{jobId}` from real live tenants
 *    (`avi.elmotalent.com.au/careers/careers/job/view/146`,
 *    `eks.elmotalent.com.au/careers/ekservices/job/view/23`), so the numeric `{jobId}`
 *    is the stable per-role ATS id. A live, parseable role list could not be observed
 *    during research (probed tenant boards either 302-redirected off the board to the
 *    ELMO marketing site or 404'd for the guessed board segment), so the parser is
 *    written defensively against the documented listing + URL shape (verified=false).
 */

/** Hosted talent host suffixes — tenant boards live at `{tenant}.elmotalent.com.au` (AU) / `.co.nz` (NZ). */
export const ELMO_HOST_SUFFIXES: readonly string[] = ['.elmotalent.com.au', '.elmotalent.co.nz'];

/** Root domains — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const ELMO_ROOT_DOMAINS: readonly string[] = ['elmotalent.com.au', 'elmotalent.co.nz'];

/** Builds a tenant's career-board origin from its slug (primary AU host suffix). */
export const elmoCareerOrigin = (tenant: string): string =>
  `https://${tenant}${ELMO_HOST_SUFFIXES[0]}`;

/**
 * Career-board index path segment. Every tenant board lives under `/careers/{board}`;
 * the `{board}` segment is supplied per-tenant (see `ELMO_BOARD_FALLBACKS`).
 */
export const ELMO_CAREERS_PATH = 'careers';

/** Career-board detail path segment (used to build canonical job-view URLs). */
export const ELMO_VIEW_PATH = 'job/view';

/** Career-board apply path segment (used to build canonical apply URLs). */
export const ELMO_APPLY_PATH = 'job/apply';

/**
 * Candidate `{board}` segments probed (in order) when the caller does not supply an
 * explicit board. The board name is often the tenant slug itself or the bare
 * `careers` segment; the first segment that renders a role list wins. A board derived
 * from the input (slug / URL path) is always tried first, ahead of these fallbacks.
 */
export const ELMO_BOARD_FALLBACKS: readonly string[] = ['careers', 'default'];

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: when a caller omits
 * `resultsWanted` entirely we ingest up to 100 of the tenant's open roles.
 */
export const ELMO_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on index pages fetched per scrape. The server-rendered board lists the
 * full tenant role set in a single document (no server-side pagination of the job set
 * is assumed), so one page per board is the norm; the ceiling guards the board-probe
 * sweep and any future variation.
 */
export const ELMO_MAX_PAGES = 50;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive ELMO talent
 * host can connect-then-hang, so we cap the shared client's 60s default to keep
 * graceful-degradation well inside callers' budgets; a healthy tenant responds in well
 * under a second. A caller may request a SHORTER timeout — we only bound the upper end.
 */
export const ELMO_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The career board expects a browser-like UA + HTML Accept. */
export const ELMO_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-AU,en;q=0.9',
};

/**
 * Captures every `/careers/{board}/job/view/{jobId}` anchor href in the server-rendered
 * board HTML. Group 1 is the board segment, group 2 is the numeric job id. The href may
 * be absolute (`https://{tenant}.elmotalent.com.au/careers/…`) or root-relative
 * (`/careers/…`); both forms are matched.
 */
export const ELMO_JOB_LINK_REGEX =
  /(?:href\s*=\s*["'])(?:https?:\/\/[^"'/]+)?\/careers\/([^/"']+)\/job\/view\/(\d+)/gi;

/**
 * Captures a single anchor element that links to a `/job/view/{jobId}` page, so the
 * adapter can read the role title from the anchor's inner text. Group 1 is the job id,
 * group 2 is the anchor inner HTML (title text, tag-stripped at the call site).
 */
export const ELMO_JOB_ANCHOR_REGEX =
  /<a\b[^>]*href\s*=\s*["'](?:https?:\/\/[^"'/]+)?\/careers\/[^/"']+\/job\/view\/(\d+)[^>]*>([\s\S]*?)<\/a>/gi;

/** Detects remote / hybrid roles across the title, location, and department fields. */
export const ELMO_REMOTE_REGEX =
  /\b(remote|hybrid|work\s*from\s*home|wfh|home[\s-]?(?:based|working)|telecommute|fully\s*remote|anywhere)\b/i;
