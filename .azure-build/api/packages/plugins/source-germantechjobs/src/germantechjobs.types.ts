/**
 * Shape of a parsed RSS item from GermanTechJobs.
 * German IT/tech job board with salary transparency.
 * Title format: "Job @ Company [min - max EUR]"
 */
export interface GermantechjobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  category: string | null;
}
