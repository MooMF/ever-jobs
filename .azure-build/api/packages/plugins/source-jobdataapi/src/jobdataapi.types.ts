/**
 * Company object nested within a JobDataAPI job.
 */
export interface JobDataApiCompany {
  name: string;
  logo: string | null;
}

/**
 * Location object nested within a JobDataAPI job.
 */
export interface JobDataApiLocation {
  city: string | null;
  country: string | null;
}

/**
 * Shape of a single job returned by the JobDataAPI.
 */
export interface JobDataApiJob {
  id: number;
  title: string;
  slug: string;
  company: JobDataApiCompany | null;
  has_remote: boolean;
  location: JobDataApiLocation | null;
  description: string | null;
  application_url: string | null;
  job_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  date_posted: string | null;
  tags: string[];
}

/**
 * Top-level paginated response envelope from the JobDataAPI.
 */
export interface JobDataApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: JobDataApiJob[];
}
