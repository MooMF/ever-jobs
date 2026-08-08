/**
 * Constants for the EasyCruit applicant-tracking careers platform.
 *
 * EasyCruit (easycruit.com, by Visma) is a Nordic recruitment / ATS platform.
 * Every customer tenant publishes a branded, public career page on its own
 * sub-domain (`https://{tenant}.easycruit.com/`) and — for each such career
 * page / channel — exposes a public, unauthenticated XML vacancy feed served
 * from the same host:
 *
 *   GET https://{tenant}.easycruit.com/export/xml/vacancy/list.xml
 *     → <?xml version="1.0" encoding="UTF-8"?>
 *       <VacancyList xmlns="urn:EasyCruit">
 *         <Vacancy id="3628965" date_start="2026-05-19"
 *                  date_end="2026-07-18" reference_number=""
 *                  date_modified="2026-05-26 08:10:51">
 *           <Versions>
 *             <Version language="da">
 *               <Title>Financial Controller</Title>
 *               <TitleHeading>…</TitleHeading>
 *               <AlternativeCompanyName>…</AlternativeCompanyName>
 *               <ApplicationDeadline>…</ApplicationDeadline>
 *               <Location>…</Location>
 *               <Engagement>…</Engagement>     // employment type
 *               <DailyHours>…</DailyHours>
 *               <Region>…</Region>
 *               <Categories>…</Categories>
 *             </Version>
 *             <Version language="en">…</Version>
 *           </Versions>
 *           <Departments>
 *             <Department id="66550">
 *               <Name>Esvagt A/S</Name>
 *               <LogoURL>…</LogoURL>
 *               <ImageURL>…</ImageURL>
 *               <VacancyURL>https://{tenant}.easycruit.com/vacancy/3628965/66550?iso=gb</VacancyURL>
 *               <ApplicationURL>…</ApplicationURL>
 *             </Department>
 *           </Departments>
 *         </Vacancy>
 *         …
 *       </VacancyList>
 *
 * The feed returns every open role for the tenant in one response (no
 * server-side pagination), so we slice client-side to honour `resultsWanted`.
 * Each `<Vacancy>` carries one or more language `<Version>` blocks; we prefer
 * the English (`en`/`gb`) version when present, else the first available. The
 * human-facing career page renders the same data as an HTML table whose job
 * links follow `/vacancy/{vacancyId}/{departmentId}?iso=gb`.
 *
 * An unknown sub-domain (HTTP 404 / 4xx) or a malformed payload degrades to an
 * empty (graceful) result rather than throwing, so a single bad tenant never
 * breaks a batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `https://esvagt.easycruit.com/?iso=gb` → public HTML career page whose
 *    job links are `/vacancy/{vacancyId}/{departmentId}?iso=gb`.
 *  - `GET https://esvagt.easycruit.com/export/xml/vacancy/list.xml` → HTTP 200
 *    `VacancyList` XML (namespace `urn:EasyCruit`) with `Vacancy` elements
 *    carrying `id`/`date_start`/`date_end`/`date_modified` attributes,
 *    `Versions/Version[@language]` (Title, Location, Engagement, Region,
 *    Categories, …) and `Departments/Department[@id]` (Name, VacancyURL,
 *    ApplicationURL).
 *  - Schema published at `https://www.easycruit.com/dtd/vacancy-list.xsd`.
 */

/** Canonical tenant career-page / feed host template. */
export const EASYCRUIT_HOST_TEMPLATE = 'https://{tenant}.easycruit.com';

/**
 * Public, unauthenticated vacancy-list XML feed path (relative to the tenant
 * host). Returns every open role for the tenant in one `VacancyList` envelope.
 */
export const EASYCRUIT_FEED_PATH = '/export/xml/vacancy/list.xml';

/**
 * Base path for a single vacancy detail / apply page, used to reconstruct a
 * job URL when the feed omits an explicit `VacancyURL`. Combined as
 * `{host}/vacancy/{vacancyId}/{departmentId}?iso={iso}`.
 */
export const EASYCRUIT_VACANCY_PATH = '/vacancy';

/**
 * Default locale query appended to reconstructed job URLs (`?iso=gb` selects
 * the English-language rendering of the career page where available).
 */
export const EASYCRUIT_DEFAULT_ISO = 'gb';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public
 * DTO default is small, but when a caller omits `resultsWanted` entirely we
 * ingest up to 100 of the tenant's open roles.
 */
export const EASYCRUIT_DEFAULT_RESULTS = 100;

/** Default request headers. The feed expects a browser-like UA + XML accept. */
export const EASYCRUIT_HEADERS: Record<string, string> = {
  Accept: 'application/xml, text/xml, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches each top-level `<Vacancy …>…</Vacancy>` block in the feed, capturing
 * its attribute string (group 1) and inner body (group 2). Tolerant of
 * attribute order and self-closing edge cases.
 */
export const EASYCRUIT_VACANCY_REGEX = /<Vacancy\b([^>]*)>([\s\S]*?)<\/Vacancy>/gi;

/**
 * Matches each `<Version language="…">…</Version>` block within a vacancy,
 * capturing the language code (group 1) and the version body (group 2).
 */
export const EASYCRUIT_VERSION_REGEX = /<Version\b[^>]*\blanguage="([^"]*)"[^>]*>([\s\S]*?)<\/Version>/gi;

/**
 * Matches each `<Department id="…">…</Department>` block, capturing the
 * department id (group 1) and the department body (group 2).
 */
export const EASYCRUIT_DEPARTMENT_REGEX = /<Department\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/Department>/gi;
