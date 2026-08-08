/**
 * TypeScript interfaces for Fountain API responses.
 *
 * Fountain is a high-volume hourly hiring platform used by 300+ enterprise
 * companies (Uber, Amazon, etc.) for frontline/hourly hiring.
 *
 * API: GET https://api.fountain.com/v2/openings
 * Auth: Bearer token
 */

export interface FountainLocation {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  zip_code?: string | null;
}

export interface FountainCompensation {
  min_amount?: number | null;
  max_amount?: number | null;
  currency?: string | null;
  interval?: string | null;
}

export interface FountainOpening {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  location?: FountainLocation | null;
  location_string?: string | null;
  department?: string | null;
  team?: string | null;
  type?: string | null;
  employment_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  url?: string | null;
  apply_url?: string | null;
  is_remote?: boolean | null;
  compensation?: FountainCompensation | null;
  status?: string | null;
  category?: string | null;
}

export interface FountainResponse {
  openings: FountainOpening[];
}
