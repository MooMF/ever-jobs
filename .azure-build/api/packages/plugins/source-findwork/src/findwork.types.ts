/**
 * Shape of a single job returned by the FindWork API.
 */
export interface FindWorkJob {
  id: number;
  role: string;
  company_name: string;
  company_num_employees: string | null;
  employment_type: string | null;
  location: string | null;
  remote: boolean;
  logo: string | null;
  url: string;
  text: string | null;
  date_posted: string;
  keywords: string[];
  source: string;
}

/**
 * Top-level response envelope from the FindWork API.
 */
export interface FindWorkApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FindWorkJob[];
}
