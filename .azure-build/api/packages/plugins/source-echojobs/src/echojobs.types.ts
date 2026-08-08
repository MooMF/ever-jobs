export interface EchoJobsResponse {
  jobs?: EchoJob[];
  data?: EchoJob[];
}

export interface EchoJob {
  id: string | number;
  title: string;
  company: string;
  company_logo?: string;
  url: string;
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  tags?: string[];
  date_posted?: string;
  published_at?: string;
  is_remote?: boolean;
  remote?: boolean;
  job_type?: string;
}
