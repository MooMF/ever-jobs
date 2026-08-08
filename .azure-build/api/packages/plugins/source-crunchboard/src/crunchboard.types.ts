/**
 * Shape of a parsed RSS item from Crunchboard.
 */
export interface CrunchboardRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
