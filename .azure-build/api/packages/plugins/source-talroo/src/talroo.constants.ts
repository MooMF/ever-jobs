export const TALROO_API_URL = 'https://api.jobs2careers.com/api/search.php';

export const TALROO_HEADERS: Record<string, string> = {
  Accept: 'application/json',
};

/**
 * Default number of results to request.
 */
export const TALROO_DEFAULT_RESULTS = 25;

/**
 * Maximum number of results the Talroo API supports per request.
 */
export const TALROO_MAX_RESULTS = 200;
