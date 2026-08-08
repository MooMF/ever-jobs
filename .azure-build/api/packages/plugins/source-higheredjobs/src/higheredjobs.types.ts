/**
 * Shape of a parsed RSS item from HigherEdJobs.
 * Standard RSS feed for higher education job board.
 */
export interface HigherEdJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
