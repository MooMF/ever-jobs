/**
 * Shape of a parsed RSS item from RemoteFirstJobs.
 * Remote-first job listings across all categories.
 */
export interface RemotefirstjobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
