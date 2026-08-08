/**
 * Shape of a parsed RSS item from Rails Job Board.
 */
export interface RailsJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
