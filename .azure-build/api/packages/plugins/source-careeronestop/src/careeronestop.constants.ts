export const CAREERONESTOP_API_URL = 'https://api.careeronestop.org/v2/jobsearch';

export const CAREERONESTOP_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
};

/**
 * Default search radius in miles.
 */
export const CAREERONESTOP_DEFAULT_RADIUS = 25;

/**
 * Default number of results to request.
 */
export const CAREERONESTOP_DEFAULT_RESULTS = 25;
