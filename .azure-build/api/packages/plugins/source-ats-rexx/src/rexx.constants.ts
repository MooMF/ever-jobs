/**
 * Constants for the rexx systems hosted career-portal platform.
 *
 * rexx systems is a German HR / recruiting software suite (ATS + HCM). Each
 * customer tenant runs a branded public job market ("Stellenangebote" /
 * "Jobbörse") served from its own sub-domain under the shared apex
 * `rexx-systems.com`, using the conventional label pattern
 * `{tenant}-portal.rexx-systems.com` (e.g. `https://icotek-portal.rexx-systems.com/`).
 * Some tenants additionally publish the same portal on a custom career domain.
 *
 * Data surface (no authentication required) — VERIFIED LIVE on 2026-06-03:
 *
 *   1. **Job market listing** — `GET {host}/stellenangebote.html`
 *      Returns a server-rendered HTML page. The open roles live inside
 *      `<section id="joboffer_table_container" data-count="N" data-all-count="N">`
 *      as a list of `<article class="joboffer_container">` cards. Each card:
 *        - `onclick="window.location.href='{detailUrl}'"` (canonical detail URL)
 *        - `.joboffer_title_text a[href]` → job title text + detail URL
 *        - `.job_details_second` → career level (e.g. "mit Berufserfahrung")
 *        - `.job_standort` → location locality (e.g. "Eschach")
 *        - `.job_location` → work mode label
 *            ("Präsenz / Mobil", "Homeoffice / Mobil", "Präsenz")
 *      The detail-page URL follows the pattern `/{slug}-de-j{id}.html`, where
 *      `{id}` is the numeric job id used as the ATS id. The `data-count`
 *      attribute (and the `<h2 class="number_jobs">N Stellenangebote</h2>`
 *      heading) gives the total open-role count for the tenant. The full
 *      listing is rendered on one page (no pagination needed for typical
 *      tenants).
 *
 *   2. **Job detail page** — `GET {host}/{slug}-de-j{id}.html`
 *      Returns a server-rendered HTML page that embeds a
 *      `<script type="application/ld+json">` block containing a complete
 *      schema.org `JobPosting` object. This structured block is the primary,
 *      stable data source (independent of presentational markup):
 *        - `title`              → job title
 *        - `datePosted`         → ISO date (e.g. "2026-04-30")
 *        - `validThrough`       → ISO date the posting expires
 *        - `employmentType`     → e.g. "FULL_TIME", "PART_TIME"
 *        - `description`        → HTML company / role intro
 *        - `responsibilities`   → HTML list of tasks
 *        - `qualifications`     → HTML list of requirements
 *        - `jobBenefits`        → HTML list of benefits
 *        - `hiringOrganization.name` → employer display name
 *        - `jobLocation.address`     → { streetAddress, addressLocality,
 *              addressRegion, postalCode, addressCountry } (PostalAddress)
 *        - `directApply`        → boolean
 *
 * Verified live on 2026-06-03 against two independent tenants:
 *   - `icotek-portal.rexx-systems.com` — `GET /stellenangebote.html`
 *     → HTTP 200, data-count="13", 13 `<article.joboffer_container>` cards.
 *     `GET /Controller-mwd-de-j182.html` → HTTP 200, JSON-LD JobPosting with
 *     full title / datePosted / employmentType / jobLocation / description.
 *   - `nobix-portal.rexx-systems.com` — `GET /stellenangebote.html`
 *     → HTTP 200, data-count="12", 12 cards. Detail JSON-LD present and
 *     identically shaped (title, datePosted, jobLocation, hiringOrganization).
 *
 * Tenant resolution: the `{tenant}` label is taken from `companySlug` (the
 * portal sub-domain label, e.g. `icotek`) and expanded to
 * `https://{tenant}-portal.rexx-systems.com`. A fully qualified `companyUrl`
 * (custom career domain or an explicit `*-portal.rexx-systems.com` host) is
 * used verbatim as the origin.
 *
 * A missing tenant, an HTTP error, or a malformed payload degrades to an
 * empty/partial result — never throws — so a single tenant never aborts a
 * batch run.
 */

/** Shared apex for every rexx-hosted tenant portal sub-domain. */
export const REXX_APEX = 'rexx-systems.com';

/**
 * Host template for rexx-hosted tenant portals. `{tenant}` is the portal
 * sub-domain label (e.g. `icotek`), substituted at runtime.
 */
export const REXX_HOST_TEMPLATE = 'https://{tenant}-portal.rexx-systems.com';

/**
 * Suffix appended to a plain `companySlug` to form the full portal label
 * (`icotek` → `icotek-portal`). Already-suffixed slugs are left untouched.
 */
export const REXX_PORTAL_SUFFIX = '-portal';

/** Path to the public job-market listing page on a tenant portal. */
export const REXX_LISTING_PATH = '/stellenangebote.html';

/** Regex that extracts the numeric job id from a detail-page URL `/...-de-j{id}.html`. */
export const REXX_JOB_ID_REGEX = /-(?:de|en|fr)?-?j(\d+)\.html(?:[?#].*)?$/i;

/** CSS selector for the listing container that carries the total-count attribute. */
export const REXX_LISTING_CONTAINER_SELECTOR = '#joboffer_table_container';

/** CSS selector for each job card on the listing page. */
export const REXX_JOB_CARD_SELECTOR = 'article.joboffer_container';

/** CSS selector for the title anchor within a job card. */
export const REXX_JOB_TITLE_SELECTOR = '.joboffer_title_text a';

/** CSS selector for the career-level chip within a job card. */
export const REXX_JOB_LEVEL_SELECTOR = '.job_details_second';

/** CSS selector for the location locality within a job card. */
export const REXX_JOB_LOCATION_SELECTOR = '.job_standort';

/** CSS selector for the work-mode label within a job card. */
export const REXX_JOB_WORKMODE_SELECTOR = '.job_location';

/** Attribute on the listing container that reports the total open-role count. */
export const REXX_COUNT_ATTR = 'data-count';

/**
 * Maximum number of detail-page fetches issued concurrently per round.
 * The detail page is where the schema.org JobPosting JSON-LD lives.
 */
export const REXX_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential concurrency rounds, to stay polite. */
export const REXX_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. When `resultsWanted` is omitted we ingest up
 * to this many of the tenant's open roles.
 */
export const REXX_DEFAULT_RESULTS = 100;

/**
 * Default request headers. The portal is served by nginx and returns
 * server-rendered HTML; a browser-like Accept / User-Agent is polite and
 * avoids trivial bot gating.
 */
export const REXX_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
};
