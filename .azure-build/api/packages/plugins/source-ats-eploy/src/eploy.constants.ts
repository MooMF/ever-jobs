/**
 * Constants for the Eploy hosted career-site platform.
 *
 * Eploy (eploy.co.uk / eploy.com) is a UK recruitment software platform
 * used primarily by public-sector organisations, local councils, NHS trusts,
 * police and fire services, and private-sector employers. Each customer
 * operates their own branded career site at a custom domain (e.g.
 * `jobs.islington.gov.uk`, `careers.example.com`) and, during implementation,
 * on a staging domain under `{customer}.eploy.net`.
 *
 * Eploy exposes **two distinct data surfaces**:
 *
 *   1. The **authenticated RESTful API** at `/api/vacancies/search` (and
 *      related routes). This requires OAuth2 / API-key credentials set up in
 *      the backend admin under Admin → Security Settings → API Keys. The
 *      rate limit is 10 req/s, 1000 req/day per key. We deliberately do NOT
 *      use this surface — it needs credentials.
 *
 *   2. The **public, anonymous XML datafeed** every Eploy career site exposes
 *      at the following path on the tenant's own domain:
 *
 *        GET {tenantUrl}/feeds/datafeed.ashx?Format=xml
 *          → XML document with root `<Vacancies Type="Vacancies" Count="N">`
 *          → each vacancy is a child `<Item>` element
 *
 *      The feed requires no authentication and is the same feed Eploy
 *      customers publish to external job boards (Indeed, Reed, etc.) via the
 *      Eploy Datafeed & Search Handler feature.
 *
 *      Verified live against `jobs.islington.gov.uk` on 2026-06-03:
 *        GET https://jobs.islington.gov.uk/feeds/datafeed.ashx?Format=xml
 *        HTTP 200, XML with 30 `<Item>` elements, Count="30".
 *
 * Wire shape per `<Item>` (verified 2026-06-03, jobs.islington.gov.uk):
 *
 *   <VacancyID>2895</VacancyID>                  — numeric → atsId + URL
 *   <Title>KS1 Class Teacher</Title>              — job title
 *   <Link>https://…/vacancies/2895/ks1-…html</Link> — canonical job page URL
 *   <Description><![CDATA[<p>…</p>]]></Description> — HTML description
 *   <Location>Islington, London</Location>        — free-text location
 *   <LocationID>4</LocationID>                   — (internal, not mapped)
 *   <Position>Children and Young People</Position> — department/category
 *   <PositionID>3</PositionID>                   — (internal)
 *   <Industry>Children and young people</Industry>
 *   <IndustryID>39</IndustryID>
 *   <VacancyType></VacancyType>                  — often empty
 *   <VacancyTypeID>0</VacancyTypeID>
 *   <DisplaySalary>£40,317 – £52,300</DisplaySalary> — formatted salary
 *   <Company></Company>                          — employer name (often empty
 *                                                   for single-employer portals)
 *   <DateCreated>Wed, 03 Jun 2026 00:00:00 GMT</DateCreated>
 *   <DatePosted>Wed, 03 Jun 2026 00:00:00 GMT</DatePosted>
 *   <Reference></Reference>
 *   <Qualifications></Qualifications>
 *   <Benefits><![CDATA[…]]></Benefits>
 *
 * Tenant resolution: `companyUrl` must point to the tenant's career-site root
 * (e.g. `https://jobs.islington.gov.uk` or `https://customerweb.eploy.net`).
 * `companySlug` is treated as a sub-domain label under the Eploy staging apex
 * `eploy.net` when no explicit URL is given (e.g. `customerweb` →
 * `https://customerweb.eploy.net`).
 */

/**
 * Staging apex domain used during Eploy implementation before a custom domain
 * is configured. Used when only `companySlug` (not a full URL) is supplied.
 */
export const EPLOY_STAGING_APEX = 'eploy.net';

/**
 * Host template for Eploy staging sub-domains.
 * `{slug}` is substituted at runtime with the `companySlug` value.
 */
export const EPLOY_STAGING_HOST_TEMPLATE = 'https://{slug}.eploy.net';

/**
 * Path to the public, anonymous XML vacancy datafeed.
 * Append `?Format=xml` to receive the structured `<Vacancies>` XML document.
 */
export const EPLOY_DATAFEED_PATH = '/feeds/datafeed.ashx';

/**
 * Query parameter to request structured XML output from the datafeed.
 * The datafeed defaults to RSS when this parameter is omitted; `Format=xml`
 * returns the custom `<Vacancies>/<Item>` structure with richer fields.
 */
export const EPLOY_FORMAT_PARAM = 'xml';

/**
 * Default internal results cap. When `resultsWanted` is omitted we ingest
 * up to this many of the tenant's open roles.
 */
export const EPLOY_DEFAULT_RESULTS = 100;

/**
 * Default request headers sent with every datafeed fetch.
 * The feed is served by an ASP.NET host, so a browser-like Accept is polite.
 */
export const EPLOY_HEADERS: Record<string, string> = {
  Accept: 'application/xml, text/xml, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9',
};
