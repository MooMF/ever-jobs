/**
 * TypeScript interfaces for BuiltIn API responses.
 */

/** A single job from the BuiltIn jobs API */
export interface BuiltInJob {
  id: number;
  title: string;
  alias?: string;
  body?: string;
  body_teaser?: string;
  company_name?: string;
  company_alias?: string;
  company_logo?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  remote_type?: string;
  job_type?: string;
  experience_level?: string;
  department?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  created?: string;
  changed?: string;
  url?: string;
  application_url?: string;
}

/** BuiltIn search response envelope */
export interface BuiltInSearchResponse {
  jobs?: BuiltInJob[];
  total?: number;
  page?: number;
  pages?: number;
}

/** BuiltIn HTML embedded JSON data */
export interface BuiltInPageData {
  props?: {
    pageProps?: {
      jobs?: BuiltInJob[];
      totalJobs?: number;
    };
  };
}
