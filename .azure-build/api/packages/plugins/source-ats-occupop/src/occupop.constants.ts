/**
 * Constants for the Occupop applicant-tracking careers platform.
 *
 * Occupop hosts the public careers sites of its customers as per-tenant
 * sub-domains under one shared apex, `https://{slug}.occupop-careers.com`, where
 * `{slug}` is the tenant's Occupop **company key**. The careers page itself is a
 * client-rendered SPA; the open-roles data is fetched from a single public,
 * unauthenticated Apollo GraphQL gateway:
 *
 *   POST https://gateway.server.occupop.com/graphql
 *     body { operationName: "LiveJobs",
 *            query: <LiveJobs query>,
 *            variables: { companyKey: "{slug}", tags: [], includeAllBrandsJobs: false } }
 *     → { data: { careersPage: { liveJobs: CareersPageJob[] } } }
 *
 * The `LiveJobs` operation resolves the tenant entirely from the `companyKey`
 * variable; there is no per-request path/query tenant param. It returns the
 * tenant's full live-roles list in one response (no server-side pagination), so
 * we fetch once and slice client-side to honour `resultsWanted`.
 *
 * A valid tenant with no open roles returns `{ liveJobs: [] }` (HTTP 200). An
 * unknown company key returns HTTP 200 with a GraphQL `errors` entry
 * (`"Invalid company key!"`) and `data: null`, which we treat as an empty
 * (graceful) result rather than an error.
 *
 * The public job-detail / apply page lives at
 * `https://{slug}.occupop-careers.com/jobs/{uuid}/apply` (verified 2026-06-03).
 */

/** Public, unauthenticated GraphQL gateway shared by every Occupop careers site. */
export const OCCUPOP_GRAPHQL_ENDPOINT = 'https://gateway.server.occupop.com/graphql';

/** Apex used to build the per-tenant careers host (`{slug}.occupop-careers.com`). */
export const OCCUPOP_CAREERS_HOST_TEMPLATE = 'https://{slug}.occupop-careers.com';

/** Public job-detail / apply page path template (`{id}` = job uuid). */
export const OCCUPOP_JOB_PAGE_TEMPLATE = '/jobs/{id}/apply';

/** GraphQL operation name the careers SPA uses to load the live-roles list. */
export const OCCUPOP_LIVE_JOBS_OPERATION = 'LiveJobs';

/**
 * The `LiveJobs` GraphQL query, captured verbatim from the public careers SPA.
 * Resolves the tenant from the `companyKey` variable and returns the full live
 * open-roles array (`careersPage.liveJobs`).
 */
export const OCCUPOP_LIVE_JOBS_QUERY = `query LiveJobs($companyKey: String!, $tags: [String!], $includeAllBrandsJobs: Boolean) {
  careersPage {
    liveJobs(companyKey: $companyKey, tags: $tags, includeAllBrandsJobs: $includeAllBrandsJobs) {
      uuid
      title
      description
      publishedAt
      companyName
      location {
        city
        country
      }
      hiringCompany {
        name
      }
      period
      subsectors {
        name
        sector {
          name
        }
      }
    }
  }
}`;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is 15, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's live roles.
 */
export const OCCUPOP_DEFAULT_RESULTS = 100;

/** Default request headers. The gateway expects a browser-like UA + JSON. */
export const OCCUPOP_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
