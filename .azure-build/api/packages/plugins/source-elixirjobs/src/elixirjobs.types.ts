/**
 * Shape of a parsed RSS item from Elixir Jobs.
 */
export interface ElixirJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
