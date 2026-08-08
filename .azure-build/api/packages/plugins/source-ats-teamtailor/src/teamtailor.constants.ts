/** Teamtailor widget API base URL */
export const TEAMTAILOR_API_URL = 'https://career.teamtailor.com/widget/jobs';

/** Teamtailor official authenticated API base URL */
export const TEAMTAILOR_OFFICIAL_API_URL = 'https://api.teamtailor.com/v1';

/** API version header required by the official Teamtailor API */
export const TEAMTAILOR_API_VERSION = '20210218';

/** Default headers for Teamtailor API requests */
export const TEAMTAILOR_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
};
