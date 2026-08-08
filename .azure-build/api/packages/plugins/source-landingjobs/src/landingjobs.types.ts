/**
 * Shape of a single job returned by the Landing.jobs API.
 */
export interface LandingJob {
  id: number;
  title: string;
  city?: string;
  country_code?: string;
  country_name?: string;
  company_id?: number;
  currency_code?: string;
  salary_low?: number;
  salary_high?: number;
  type?: string;
  remote?: boolean;
  relocation_paid?: boolean;
  role_description?: string;
  nice_to_have?: string;
  perks?: string;
  reward?: number;
  tags?: string[];
  expires_at?: string;
  published_at?: string;
}
