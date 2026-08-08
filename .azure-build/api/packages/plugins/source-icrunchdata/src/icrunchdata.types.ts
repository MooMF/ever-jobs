/**
 * Shape of a parsed RSS item from iCrunchData.
 * Data science and analytics job board (US).
 */
export interface IcrunchdataRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
  dcCreator: string | null;
}
