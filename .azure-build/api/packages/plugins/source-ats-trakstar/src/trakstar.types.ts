/**
 * TypeScript interfaces for Trakstar Hire API responses.
 *
 * The Trakstar Hire API (GET /api/v1/openings) returns a JSON array
 * of job opening objects.
 *
 * @see https://hire.trakstar.com/api
 */

export interface TrakstarJob {
  id: number;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  employment_type: string | null;
  category: string | null;
  url: string | null;
  apply_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  remote: boolean | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
}
