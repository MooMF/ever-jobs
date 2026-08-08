/**
 * TypeScript interfaces for Deel ATS API responses.
 *
 * @see https://developer.letsdeel.com
 */

export interface DeelLocation {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface DeelSalary {
  min_amount?: number | null;
  max_amount?: number | null;
  currency?: string | null;
  interval?: string | null;
}

export interface DeelJobPosting {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  location?: DeelLocation | null;
  department?: string | null;
  employment_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  url?: string | null;
  apply_url?: string | null;
  salary?: DeelSalary | null;
  status?: string | null;
  remote?: boolean | null;
  company_name?: string | null;
  team?: string | null;
}

export interface DeelResponse {
  data: DeelJobPosting[];
}
