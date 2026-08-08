export const UNDPJOBS_RSS_URL = 'https://jobs.undp.org/rss_feeds/rss.xml';
export const UNDPJOBS_DEFAULT_RESULTS = 25;

export const UNDPJOBS_HEADERS: Record<string, string> = {
  'Accept': 'application/xml, text/xml, application/rss+xml',
  'User-Agent': 'ever-jobs/0.1.0 (job-aggregator)',
};
