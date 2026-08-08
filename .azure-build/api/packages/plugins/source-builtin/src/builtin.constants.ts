/** BuiltIn GraphQL API endpoint */
export const BUILTIN_API_URL = 'https://api.builtin.com/graphql';

/** BuiltIn public site base URL */
export const BUILTIN_BASE_URL = 'https://builtin.com';

/** Default delay between requests (ms) */
export const BUILTIN_DELAY_MIN = 1500;
export const BUILTIN_DELAY_MAX = 3000;

/** Default page size */
export const BUILTIN_PAGE_SIZE = 20;

/** BuiltIn API headers */
export const BUILTIN_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: 'https://builtin.com',
  Referer: 'https://builtin.com/jobs',
};

/** BuiltIn location slugs for major tech hubs */
export const BUILTIN_LOCATIONS: Record<string, string> = {
  'san francisco': 'san-francisco',
  'new york': 'new-york',
  'los angeles': 'los-angeles',
  chicago: 'chicago',
  boston: 'boston',
  seattle: 'seattle',
  austin: 'austin',
  denver: 'denver',
  colorado: 'colorado',
  remote: 'remote',
};

/** Map BuiltIn job types to standard types */
export const BUILTIN_JOB_TYPES: Record<string, string> = {
  'Full-Time': 'fulltime',
  'Part-Time': 'parttime',
  Contract: 'contract',
  Internship: 'internship',
  Temporary: 'temporary',
};
