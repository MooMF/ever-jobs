/**
 * Constants for the Flatchr hosted career-site platform.
 *
 * Flatchr is a French SaaS recruitment / applicant-tracking platform. Every
 * customer tenant gets a public, branded career site served from the shared
 * host `careers.flatchr.io` under a per-tenant company slug
 * (e.g. `https://careers.flatchr.io/fr/company/flatchr/`). The slug — referred
 * to as "la référence unique de votre entreprise" in the tenant's advanced
 * settings — is the same value used in the career-site iframe embed code.
 *
 * The career site is rendered from a single public, anonymous JSON endpoint
 * that the front end fetches to list a tenant's currently-published vacancies:
 *
 *   GET https://careers.flatchr.io/company/{slug}.json
 *     → HTTP 200 `{ items: FlatchrListItem[] }` for a known tenant
 *     → HTTP 404 `{ message: "Not available for slug …" }` for an unknown slug
 *
 * No authentication is required. The listing already embeds the FULL vacancy
 * record for every open role — title, multi-part HTML description
 * (`description` + `mission` + `profile`), structured `address`, contract type,
 * `metier` (department/function), the `remote` flag, salary range, the company
 * object (with the human-readable `name`), and the vacancy `slug`. Because the
 * description is embedded inline, NO per-vacancy detail fan-out is required —
 * a single request returns everything for the tenant. This contrasts with
 * platforms whose listing endpoint omits the description and needs a second
 * call per job.
 *
 * Optional filter query params accepted by the endpoint (not used here):
 *   `id`, `activity`, `metier`, `locality`,
 *   `administrative_area_level_1`, `filter`, `affiliated`.
 *
 * The public job-detail page URL follows the pattern:
 *   `https://careers.flatchr.io/company/{slug}/vacancy/{vacancy_slug}/`
 * where `{vacancy_slug}` is the vacancy's `slug` field (which already carries
 * the vacancy id as its leading token, e.g.
 * `wy3eop2jollp1kmq-account-executive-_-saas-rh-h-f`).
 *
 * Tenant resolution: the company slug is taken from `companySlug`, or derived
 * from `companyUrl` by extracting the segment after `/company/` in a
 * `careers.flatchr.io/.../company/{slug}/...` URL (falling back to the first
 * sub-domain label for a tenant custom domain).
 *
 * A missing tenant, an HTTP error, or a malformed payload degrades to an
 * empty/partial result — never throws — so a single tenant never aborts a
 * batch run.
 *
 * Verified live on 2026-06-03:
 *   - GET https://careers.flatchr.io/company/flatchr.json
 *       → HTTP 200, `{ items: [...] }`, 3 published vacancies, each with full
 *         embedded HTML description, `address`, `contract_type: "CDI"`,
 *         `metier: "Commercial conseil"`, `company.name: "Flatchr"`,
 *         `remote: "notime"`, salary 45000–80000 EUR.
 *   - GET https://careers.flatchr.io/company/groupeaudeo.json
 *       → HTTP 200, 2 published vacancies (second confirmed multi-tenant case).
 *   - GET https://careers.flatchr.io/company/<unknown>.json
 *       → HTTP 404, `{ message: "Not available for slug …" }` (clean degrade).
 */

/** Shared public host serving every Flatchr-hosted tenant career site. */
export const FLATCHR_CAREERS_HOST = 'https://careers.flatchr.io';

/**
 * Path template for the public, anonymous JSON vacancy listing.
 * `{slug}` is substituted at runtime with the tenant's company slug.
 */
export const FLATCHR_COMPANY_JSON_TEMPLATE = '/company/{slug}.json';

/**
 * Path template for the public job-detail page on the shared career host.
 * `{slug}` is the tenant company slug; `{vacancySlug}` is the vacancy `slug`.
 */
export const FLATCHR_VACANCY_PAGE_TEMPLATE =
  '/company/{slug}/vacancy/{vacancySlug}/';

/**
 * Default internal results cap. When `resultsWanted` is omitted we ingest up
 * to this many of the tenant's open roles. The listing endpoint returns every
 * published vacancy in one response, so this is a slice limit only.
 */
export const FLATCHR_DEFAULT_RESULTS = 100;

/**
 * The `remote` field on a vacancy is an enum-ish string. The known
 * non-remote sentinel is `"notime"`; any other "remote"/"télétravail" style
 * value (or the partial flag) is treated as remote-capable.
 */
export const FLATCHR_REMOTE_NONE = 'notime';

/**
 * Default request headers sent with every listing fetch. The endpoint serves
 * plain JSON and needs no special headers; a browser-like Accept / User-Agent
 * is sent to stay polite and avoid trivial bot gating.
 */
export const FLATCHR_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
};
