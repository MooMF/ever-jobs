/**
 * Shape of a parsed RSS item from the Clojure Job Board.
 * Standard RSS 2.0 feed for Clojure programming jobs.
 */
export interface ClojurejobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
