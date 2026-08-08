/**
 * TypeScript interfaces for SimplyHired job cards parsed from HTML.
 */

export interface SimplyHiredJobCard {
  title: string;
  url: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  postedDate: string | null;
  snippet: string | null;
}
