export const VUEJOBS_RSS_URL = 'https://vuejobs.com/feed';
export const VUEJOBS_DEFAULT_RESULTS = 25;

export const VUEJOBS_HEADERS: Record<string, string> = {
  'Accept': 'application/xml, text/xml, application/rss+xml',
  'User-Agent': 'ever-jobs/0.1.0 (job-aggregator)',
};
