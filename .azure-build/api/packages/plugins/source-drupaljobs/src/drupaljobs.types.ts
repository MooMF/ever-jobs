/**
 * Shape of a parsed RSS item from Drupal Jobs.
 */
export interface DrupalJobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
