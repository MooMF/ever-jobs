/**
 * Shape of a parsed RSS item from Cryptocurrency Jobs.
 * The feed is RSS 2.0 with ~75 items; titles include "Position at Company".
 */
export interface CryptocurrencyJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
