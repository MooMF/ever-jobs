/**
 * TypeScript interfaces for Homerun API responses.
 */

export interface HomerunJob {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  department?: string | null;
  employment_type?: string | null;
  application_url?: string | null;
  slug?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
}

export interface HomerunResponse {
  data?: HomerunJob[] | null;
  meta?: {
    current_page?: number | null;
    last_page?: number | null;
    per_page?: number | null;
    total?: number | null;
  } | null;
}
