/**
 * Constants for the TrackerRMS (Tracker / tracker-rms.com) staffing & recruiting ATS.
 *
 * TrackerRMS powers staffing-agency back offices, and exposes each tenant's open
 * roles to the public through its "Publish Jobs to your Website" / "Jobs+"
 * integration. That integration is served by the shared, regional EVO Portal host
 * and is a free, unauthenticated job feed addressed by the tenant's TrackerRMS
 * database name:
 *
 *   https://evoportal{region}.tracker-rms.com/{database}/jobs?fields={csv}[&filters={f}]
 *
 * where `{region}` is one of the public TrackerRMS data-centre suffixes:
 *
 *   - `us` → https://evoportalus.tracker-rms.com   (United States)
 *   - `uk` → https://evoportaluk.tracker-rms.com   (United Kingdom / EU)
 *   - `ca` → https://evoportalca.tracker-rms.com   (Canada)
 *
 * The `fields` query parameter is a CSV of the columns the tenant chose to expose
 * (commonly `reference,title,location,worktype,salary,description,linkregister`);
 * the host renders those fields as a server-side HTML `<ul><li>…</li></ul>`
 * fragment — one `<li>` block per open role — that the tenant embeds into their
 * own careers page with a single line of HTML. The `linkregister` field renders
 * the per-role apply / candidate-registration link, whose canonical shape is:
 *
 *   https://evoportal{region}.tracker-rms.com/{database}/apply?jobcode={reference}
 *
 * Because the feed is server-rendered HTML (not a JSON API) and the exact column
 * set is tenant-configurable, the adapter requests a known, broad field set and
 * parses each `<li>` block defensively: a missing field, a malformed block, or a
 * differently-ordered column set degrades to a partial role rather than throwing.
 * An unknown tenant / wrong region returns either an empty feed or an HTTP 4xx,
 * both of which degrade to an empty result.
 *
 * Surface confidence (researched + observed live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing
 *    (`https://evoportal{us|uk|ca}.tracker-rms.com/{database}/jobs?fields=…`) and a
 *    real, named tenant on it: `Tracker_PrecisionResources` (Precision Resources,
 *    a US staffing firm — its feed renders live `<li>` job blocks with apply links
 *    of the form `…/PrecisionResources/apply?jobcode=…`).
 *  - The feed is server-rendered HTML whose per-`<li>` field layout is
 *    tenant-configured; the adapter therefore narrows each field heuristically and
 *    treats every consumed value as best-effort (verified=false: the host + URL
 *    shape are confirmed live, but the exact, stable per-field DOM contract across
 *    tenants is not guaranteed, so the parser is fully defensive).
 */

/** Public, regional EVO Portal hosts that serve the unauthenticated job feed. */
export const TRACKERRMS_PORTAL_HOSTS: Record<string, string> = {
  us: 'https://evoportalus.tracker-rms.com',
  uk: 'https://evoportaluk.tracker-rms.com',
  ca: 'https://evoportalca.tracker-rms.com',
};

/** Default region used when a caller does not (and a URL cannot) indicate one. */
export const TRACKERRMS_DEFAULT_REGION = 'us';

/** Root portal domain — used to recognise tenant hosts passed via `companyUrl`. */
export const TRACKERRMS_ROOT_DOMAIN = 'tracker-rms.com';

/** Public open-roles feed path (HTML fragment; appended after the database name). */
export const TRACKERRMS_JOBS_PATH = '/jobs';

/** Per-role apply / candidate-registration path (keyed by `jobcode={reference}`). */
export const TRACKERRMS_APPLY_PATH = '/apply';

/**
 * Field set requested from the feed. The host only renders the columns the tenant
 * enabled, but requesting a broad set maximises the metadata we can recover; the
 * parser tolerates any subset (or super-set) actually returned.
 */
export const TRACKERRMS_FIELDS = 'reference,title,location,worktype,salary,description,linkregister';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const TRACKERRMS_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on `<li>` blocks parsed per scrape. The feed is a single document
 * (no server-side pagination), so this guards against a pathologically large feed
 * spinning the parser unbounded.
 */
export const TRACKERRMS_MAX_ITEMS = 500;

/** Default request headers. The host expects a browser-like UA. */
export const TRACKERRMS_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Matches each role block (`<li>…</li>`) in the rendered feed fragment. */
export const TRACKERRMS_ITEM_REGEX = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

/** Matches the role heading (`<h1>`–`<h6>` or a `<strong>`) inside a role block. */
export const TRACKERRMS_TITLE_REGEX = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i;

/** Matches any anchor href inside a role block (the apply / register link). */
export const TRACKERRMS_LINK_REGEX = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i;

/** Extracts the `jobcode` (TrackerRMS reference) from an apply / register URL. */
export const TRACKERRMS_JOBCODE_REGEX = /[?&]jobcode=([^&#"']+)/i;

/** Extracts a `reference|<n>` (or `reference=<n>`) token from a filters / URL string. */
export const TRACKERRMS_REFERENCE_REGEX = /\b(?:reference[|=]|ref[:#]?\s*)([A-Za-z0-9._-]+)\b/i;

/** Detects remote / home-working roles across the title, location, and worktype fields. */
export const TRACKERRMS_REMOTE_REGEX =
  /\b(remote|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|telecommute|fully\s*remote)\b/i;
