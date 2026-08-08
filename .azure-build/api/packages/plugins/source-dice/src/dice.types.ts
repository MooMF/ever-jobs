/**
 * TypeScript interfaces for Dice REST API responses and HTML fallback.
 */

/** A single job result from the Dice search API */
export interface DiceApiJob {
  id: string;
  title: string;
  companyName?: string;
  summary?: string;
  detailsPageUrl?: string;
  formattedLocation?: string;
  postedDate?: string;
  modifiedDate?: string;
  jobLocation?: {
    displayName?: string;
    latitude?: number;
    longitude?: number;
  };
  salary?: string;
  payRateRange?: {
    min?: number;
    max?: number;
  };
  employmentType?: string;
  isRemote?: boolean;
  jobId?: string;
}

/** The Dice search API response envelope */
export interface DiceApiResponse {
  data: DiceApiJob[];
  meta?: {
    totalHits?: number;
    page?: number;
    pageSize?: number;
  };
  queryId?: string;
}

/** Legacy HTML card interface (kept for fallback) */
export interface DiceJobCard {
  title: string;
  url: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  postedDate: string | null;
  employmentType: string | null;
}
