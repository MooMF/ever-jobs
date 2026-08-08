/**
 * Shape of a parsed RSS item from iOS Dev Jobs.
 * Title format: "Title @ Company"
 * Description contains CDATA with salary and location info.
 */
export interface IosdevjobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
