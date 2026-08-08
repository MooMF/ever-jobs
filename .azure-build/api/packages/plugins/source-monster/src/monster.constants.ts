/**
 * Monster Apps API endpoint (lower anti-bot protection than main site).
 * Uses POST with JSON body for job search.
 */
export const MONSTER_API_URL =
  'https://appsapi.monster.io/jobs-svx-service/v2/monster/search-jobs/samsearch/en-US';

/** Monster HTML search URL (fallback when API is blocked) */
export const MONSTER_SEARCH_URL = 'https://www.monster.com/jobs/search';

/** Page size for API requests */
export const MONSTER_API_PAGE_SIZE = 25;

/** Page size for HTML scraping */
export const MONSTER_HTML_PAGE_SIZE = 20;

/** Delay between page requests (ms) — higher because of DataDome anti-bot */
export const MONSTER_DELAY_MIN = 4000;
export const MONSTER_DELAY_MAX = 8000;

/**
 * Headers for the Monster JSON API.
 * The API endpoint requires specific Origin / Referer to avoid immediate blocks.
 */
export const MONSTER_API_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Origin: 'https://www.monster.com',
  Referer: 'https://www.monster.com/',
};

/**
 * Browser-like headers for HTML scraping fallback.
 * Must closely mimic a real Chrome session to bypass DataDome.
 */
export const MONSTER_HTML_HEADERS: Record<string, string> = {
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
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};
