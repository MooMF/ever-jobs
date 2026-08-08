/**
 * Shape of a parsed RSS item from LaraJobs.
 * Standard RSS feed for Laravel/PHP job board.
 */
export interface LaraJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
