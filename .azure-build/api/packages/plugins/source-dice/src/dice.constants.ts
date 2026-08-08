/** Dice REST API endpoint for job search */
export const DICE_API_URL = 'https://job-search-api.svc.dhigroupinc.com/v1/dice/jobs/search';

/** Dice HTML search URL (fallback) */
export const DICE_SEARCH_URL = 'https://www.dice.com/jobs';

/** Default delay between page requests (ms) */
export const DICE_DELAY_MIN = 2000;
export const DICE_DELAY_MAX = 4000;

/** Default headers for Dice REST API */
export const DICE_API_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-api-key': '1YAt0R9wBg4WfsF9VB2778F5CHLAPMVW3WAZcKd8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/** Default headers for HTML fallback */
export const DICE_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

/** Page size per request */
export const DICE_PAGE_SIZE = 20;
