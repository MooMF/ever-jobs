/**
 * Authentic Jobs API base URL.
 */
export const AUTHENTICJOBS_API_URL = 'https://authenticjobs.com/api/';

/**
 * Default query parameters included in every request.
 */
export const AUTHENTICJOBS_DEFAULT_PARAMS: Record<string, string> = {
  format: 'json',
};

/**
 * API method for searching jobs.
 */
export const AUTHENTICJOBS_METHOD_SEARCH = 'aj.jobs.search';

/**
 * API method for fetching recent jobs.
 */
export const AUTHENTICJOBS_METHOD_RECENT = 'aj.jobs.getRecent';

/**
 * Default number of results to request per page (max 100).
 */
export const AUTHENTICJOBS_DEFAULT_RESULTS = 25;

/**
 * Default headers for API requests.
 */
export const AUTHENTICJOBS_HEADERS: Record<string, string> = {
  Accept: 'application/json',
};
