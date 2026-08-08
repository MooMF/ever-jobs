/**
 * Shape of a parsed RSS item from Guardian Jobs.
 * Title format: "COMPANY: Job Title"
 * Description contains salary + description + location.
 */
export interface GuardianjobsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
