export const SOLIDJOBS_API_URL = 'https://solid.jobs/public-api/offers';

/**
 * The `campaign` query parameter is mandatory — the server replies
 * HTTP 400 without it (lowercase letters, numbers and dashes,
 * max 64 chars). The value is echoed into returned offer URLs as a
 * referral suffix. Verified live on 2026-06-11.
 */
export const SOLIDJOBS_CAMPAIGN = 'api';

export const SOLIDJOBS_DEFAULT_DIVISION = 'it';

/** Env var holding a comma-separated division override list. */
export const SOLIDJOBS_DIVISIONS_ENV = 'SOLIDJOBS_DIVISIONS';

export const SOLIDJOBS_DEFAULT_RESULTS = 100;

export const SOLIDJOBS_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
};
