export const LANDINGJOBS_API_URL = 'https://landing.jobs/api/v1/jobs';

/** Maximum number of jobs to request per page (API maximum). */
export const LANDINGJOBS_PAGE_SIZE = 50;

/** Maximum number of pages to fetch to avoid excessive requests. */
export const LANDINGJOBS_MAX_PAGES = 5;

export const LANDINGJOBS_HEADERS: Record<string, string> = {
  Accept: 'application/json',
};
