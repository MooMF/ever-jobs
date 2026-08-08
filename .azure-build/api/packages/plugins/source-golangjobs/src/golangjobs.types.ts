/**
 * Shape of a parsed RSS item from Golang Jobs.
 */
export interface GolangJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
