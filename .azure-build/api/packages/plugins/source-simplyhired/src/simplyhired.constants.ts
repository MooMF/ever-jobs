/** SimplyHired search URL */
export const SIMPLYHIRED_SEARCH_URL = 'https://www.simplyhired.com/search';

/** Default delay between page requests (ms) */
export const SIMPLYHIRED_DELAY_MIN = 2000;
export const SIMPLYHIRED_DELAY_MAX = 5000;

/** Default headers for SimplyHired requests */
export const SIMPLYHIRED_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};
