/**
 * Shape of a parsed RSS item from Jobspresso.
 * Standard WordPress job_listing custom post type RSS feed.
 */
export interface JobspressoRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
