export interface Web3CareerResponse {
  data?: Web3CareerJob[];
  jobs?: Web3CareerJob[];
}

export interface Web3CareerJob {
  id: string | number;
  title: string;
  company: string;
  company_logo?: string;
  url?: string;
  link?: string;
  description?: string;
  location?: string;
  tags?: string[];
  category?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  date_posted?: string;
  created_at?: string;
  is_remote?: boolean;
  remote?: boolean;
}
