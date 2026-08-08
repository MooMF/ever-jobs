/**
 * TypeScript interfaces for Loxo API responses.
 *
 * The Loxo public career board API returns a JSON array of job objects.
 * Fields may vary depending on how the recruiting firm configures their board.
 *
 * @see https://app.loxo.co/api/{companySlug}/jobs
 */

export interface LoxoJobLocation {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  postal_code?: string | null;
}

export interface LoxoCompensation {
  min?: number | null;
  max?: number | null;
  currency?: string | null;
  interval?: string | null;
}

export interface LoxoJob {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
  location?: string | LoxoJobLocation | null;
  department?: string | null;
  type?: string | null;
  employment_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  url?: string | null;
  apply_url?: string | null;
  remote?: boolean | null;
  salary?: LoxoCompensation | null;
  compensation?: LoxoCompensation | null;
  category?: string | null;
  tags?: string[] | null;
  status?: string | null;
  company_name?: string | null;
}
