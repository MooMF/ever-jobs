/**
 * Constants for the JobDiva applicant-tracking / staffing platform.
 *
 * JobDiva (jobdiva.com) is a large US-based staffing & recruiting ATS / VMS
 * used by staffing agencies and recruiting firms. Every customer tenant
 * publishes a branded, public, anonymous candidate portal hosted on the shared
 * JobDiva portal hosts (`https://www1.jobdiva.com/portal/`,
 * `https://www2.jobdiva.com/portal/`, …). Each tenant is addressed by a single
 * opaque portal key passed as the `a` query parameter — the tenant's public
 * read key for its open-roles feed:
 *
 *   GET https://www1.jobdiva.com/portal/?a={portalId}
 *     → HTML candidate-portal page ("Current Openings") for the tenant.
 *
 * Behind that portal, JobDiva exposes two **public, unauthenticated XML jobs
 * feeds** keyed by the same `a={portalId}` token. Both return one XML document
 * (root `<outertag>`) holding every open role as a child `<job>` — there is no
 * server-side pagination, so we fetch once and slice client-side to honour
 * `resultsWanted`:
 *
 *   1. Candidate "my jobs" portal feed — the primary surface; carries the full
 *      `<jobdescription>` body plus structured location / rate / division
 *      fields:
 *
 *        GET https://www1.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a={portalId}
 *          → <outertag>
 *               <systemtime>…</systemtime>
 *               <jobs>
 *                 <job>
 *                   <ID>1</ID>
 *                   <jobdivaid>32393466</jobdivaid>
 *                   <jobdiva_no>26-00826</jobdiva_no>
 *                   <portal_url>https://www1.jobdiva.com/portal/…</portal_url>
 *                   <title>ServiceNow Technical Architect</title>
 *                   <location>Dallas, TEXAS</location>
 *                   <issuedate>…</issuedate>
 *                   <startdate>…</startdate>
 *                   <enddate></enddate>
 *                   <division>…</division>
 *                   <positiontype>Contract</positiontype>
 *                   <ratemin>…</ratemin>
 *                   <ratemax>…</ratemax>
 *                   <rateper>…</rateper>
 *                   <onsiteflexibility>…</onsiteflexibility>
 *                   <jobdescription><![CDATA[…full job-ad HTML…]]></jobdescription>
 *                 </job>
 *                 …
 *               </jobs>
 *             </outertag>
 *
 *   2. Employer "connect" list feed — the same envelope with richer structured
 *      location fields (`<city>`, `<state>`, `<state_abbr>`, `<countryid>`),
 *      `<company>`, `<experience_level>`, `<primary_recruiter>`, and a
 *      truncated `<jobdescription_400char>`:
 *
 *        GET https://www1.jobdiva.com/employers/connect/listofportaljobs.jsp?a={portalId}
 *          → <outertag><systemtime/><jobs><job>…</job></jobs></outertag>
 *
 * The adapter fetches the candidate feed first (full description) and falls
 * back to the employer feed (richer structured location) when the first yields
 * no roles. The portal host can be `www1`/`www2`/`www3` — when a caller passes
 * only a bare portal key we default to `www1` and probe the others on a hard
 * failure.
 *
 * An unknown / dead portal key (HTTP 4xx) or a malformed payload degrades to an
 * empty (graceful) result rather than throwing, so a single bad tenant never
 * breaks a batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `https://www1.jobdiva.com/portal/?a=a7jdnwsus2fmiuqyajck4mcntz54pf05a6mnogtaphm9mt9tz8opkrtglw4v6gqf`
 *    → HTML candidate portal ("Current Openings").
 *  - `GET https://www1.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a=…`
 *    → HTTP 200 XML `<outertag>` with a `<jobs>`/`<job>` list carrying
 *    `<jobdescription>` bodies.
 *  - `GET https://www1.jobdiva.com/employers/connect/listofportaljobs.jsp?a=…`
 *    → HTTP 200 XML `<outertag>` with the same `<job>` list plus
 *    `<city>`/`<state>`/`<state_abbr>`/`<countryid>` and `<company>`.
 */

/** Default JobDiva portal host (the shared multi-tenant portal cluster). */
export const JOBDIVA_DEFAULT_HOST = 'https://www1.jobdiva.com';

/**
 * Candidate-portal hosts JobDiva spreads tenants across. When a caller supplies
 * only a bare portal key (no host), we default to `www1` and probe the others
 * if the primary host hard-fails (DNS / 5xx) without yielding roles.
 */
export const JOBDIVA_HOST_CANDIDATES: readonly string[] = [
  'https://www1.jobdiva.com',
  'https://www2.jobdiva.com',
  'https://www3.jobdiva.com',
];

/**
 * Primary public XML jobs feed (candidate "my jobs" portal feed). Carries the
 * full `<jobdescription>` body. `?a={portalId}` selects the tenant.
 */
export const JOBDIVA_CANDIDATE_FEED_PATH = '/candidates/myjobs/getportaljobs.jsp';

/**
 * Secondary public XML jobs feed (employer "connect" list feed). Carries richer
 * structured location fields (`<city>`/`<state>`/`<state_abbr>`/`<countryid>`)
 * and `<company>` but only a truncated `<jobdescription_400char>` body.
 */
export const JOBDIVA_EMPLOYER_FEED_PATH = '/employers/connect/listofportaljobs.jsp';

/**
 * Public candidate-portal page path. Used to build the canonical apply / job
 * portal URL for a tenant when a `<portal_url>` is not present on the item.
 */
export const JOBDIVA_PORTAL_PATH = '/portal/';

/**
 * The query parameter that carries a tenant's opaque portal key (its public
 * read key for the open-roles feed).
 */
export const JOBDIVA_PORTAL_PARAM = 'a';

/**
 * Matches a JobDiva portal key embedded in a portal / feed URL
 * (`…?a={portalId}…`), capturing the opaque key. Keys are long, URL-safe
 * hex-ish tokens.
 */
export const JOBDIVA_PORTAL_KEY_REGEX = /[?&]a=([A-Za-z0-9]+)/;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public
 * DTO default is small, but when a caller omits `resultsWanted` entirely we
 * ingest up to 100 of the tenant's open roles.
 */
export const JOBDIVA_DEFAULT_RESULTS = 100;

/** Default request headers. The feed is served by a Java host; XML accept. */
export const JOBDIVA_HEADERS: Record<string, string> = {
  Accept: 'application/xml, text/xml, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
