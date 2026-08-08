/**
 * Shape of a parsed RSS item from VirtualVocations.
 * Remote/work-from-home job board (US focus).
 */
export interface VirtualVocationsRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
}
