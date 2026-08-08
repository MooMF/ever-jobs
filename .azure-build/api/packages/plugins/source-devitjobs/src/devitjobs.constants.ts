export const DEVITJOBS_FEED_URL = 'https://devitjobs.com/job_feed.xml';
export const DEVITJOBS_DEFAULT_RESULTS = 25;
export const DEVITJOBS_MAX_RESULTS = 200;

export const DEVITJOBS_HEADERS: Record<string, string> = {
  'Accept': 'application/xml, text/xml',
  'User-Agent': 'ever-jobs/0.1.0 (job-aggregator)',
};
