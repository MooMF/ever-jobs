/**
 * Shape of a parsed RSS item from CryptoJobsList.
 * Uses Dublin Core (dc:) and Media RSS (media:) namespaces.
 */
export interface CryptoJobsListRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
  dcCreator: string | null;
  mediaContent: string | null;
  mediaLocation: string | null;
}
