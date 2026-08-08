/**
 * Shape of a parsed RSS item from Jobs in Japan.
 * WordPress-based job board RSS feed with custom fields.
 */
export interface JobsInJapanRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  creator: string | null;
  contentEncoded: string | null;
  company: string | null;
  jobType: string | null;
  jobAddress: string | null;
  salary: string | null;
}
