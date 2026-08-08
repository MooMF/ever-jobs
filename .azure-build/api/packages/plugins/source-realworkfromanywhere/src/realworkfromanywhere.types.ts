/**
 * Shape of a parsed RSS item from Real Work From Anywhere.
 */
export interface RealWorkFromAnywhereRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
