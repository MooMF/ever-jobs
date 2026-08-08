/**
 * Shape of a parsed RSS item from DevOpsJobs.io.
 * Title format: "Job Title - Company - Location"
 * Description contains CDATA-wrapped HTML.
 */
export interface DevopsjobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
