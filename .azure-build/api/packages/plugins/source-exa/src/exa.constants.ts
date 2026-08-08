/**
 * Default configuration for Exa job search.
 */

/**
 * Job board domains to target when searching via Exa.
 * These can be overridden by the user through the ScraperInputDto.
 */
export const DEFAULT_JOB_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'lever.co',
  'greenhouse.io',
  'jobs.ashbyhq.com',
  'boards.greenhouse.io',
  'apply.workable.com',
  'angel.co',
  'wellfound.com',
  'remoteok.com',
  'weworkremotely.com',
  'stackoverflow.com',
  'dice.com',
  'ziprecruiter.com',
  'simplyhired.com',
  'monster.com',
  'careers.google.com',
];

/**
 * Default number of results to fetch from Exa.
 */
export const DEFAULT_NUM_RESULTS = 15;

/**
 * Default Exa search type.
 * "auto" lets Exa decide between neural and keyword search.
 */
export const DEFAULT_SEARCH_TYPE: 'auto' | 'neural' | 'keyword' = 'auto';
