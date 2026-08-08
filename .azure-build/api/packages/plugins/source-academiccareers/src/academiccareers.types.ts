/**
 * Shape of a parsed RSS item from Academic Careers.
 * Higher education and academic position listings.
 */
export interface AcademiccareersRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  creator: string | null;
}
