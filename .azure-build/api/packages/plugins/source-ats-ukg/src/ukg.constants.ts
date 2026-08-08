/**
 * UKG Pro Recruiting (formerly UltiPro) career site API endpoint.
 * The slug (company-specific subdomain) is interpolated at runtime.
 */
export const UKG_API_URL = 'https://recruiting.ultipro.com';

/** Default headers for UKG career site requests */
export const UKG_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
};
