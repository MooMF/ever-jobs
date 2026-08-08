/** CareerBuilder search URL */
export const CB_SEARCH_URL = 'https://www.careerbuilder.com/jobs';

/** Page size per request (CareerBuilder returns ~25 results per page) */
export const CB_PAGE_SIZE = 25;

/** Delay between page requests (ms) — higher due to Cloudflare protection */
export const CB_DELAY_MIN = 4000;
export const CB_DELAY_MAX = 7000;

/**
 * Browser-like headers required to bypass Cloudflare anti-bot detection.
 * These must closely mimic a real Chrome browser session.
 */
export const CB_HEADERS: Record<string, string> = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};
