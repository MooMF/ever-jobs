/**
 * Shape of a parsed RSS item from FossJobs.
 * Standard RSS feed for Free & Open Source Software jobs.
 */
export interface FossJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
