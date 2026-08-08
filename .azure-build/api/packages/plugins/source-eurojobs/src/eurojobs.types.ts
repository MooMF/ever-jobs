/**
 * Shape of a parsed RSS item from EuroJobs.
 * European job market covering Spain, Greece, Italy, Austria, etc.
 */
export interface EurojobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
