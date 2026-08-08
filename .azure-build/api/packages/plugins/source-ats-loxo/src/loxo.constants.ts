/** Loxo API base URL */
export const LOXO_API_URL = 'https://app.loxo.co/api';

/** Default headers for Loxo API requests */
export const LOXO_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
};

/** Delay between requests in milliseconds */
export const LOXO_DELAY_MS = 1000;
