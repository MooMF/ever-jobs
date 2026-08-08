/**
 * Shape of a parsed RSS item from SwissDevJobs.
 * Swiss IT/tech job board with salary transparency.
 * Title format: "Job @ Company [CHF min - max]"
 */
export interface SwissdevjobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
