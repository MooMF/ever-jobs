export const ARBEITSAGENTUR_API_URL =
  'https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs';

export const ARBEITSAGENTUR_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
};

/**
 * Default number of results to request.
 */
export const ARBEITSAGENTUR_DEFAULT_RESULTS = 25;
