/**
 * TypeScript interfaces for Crelate API responses.
 */

export interface CrelateJob {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  is_remote: boolean;
  created_date: string | null;
  modified_date: string | null;
  status: string | null;
}
