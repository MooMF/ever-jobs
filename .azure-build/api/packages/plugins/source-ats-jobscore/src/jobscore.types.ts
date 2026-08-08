/**
 * TypeScript interfaces for JobScore public feed responses.
 */

export interface JobScoreLocation {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface JobScoreJob {
  id?: string | number | null;
  title?: string | null;
  detail_url?: string | null;
  description?: string | null;
  department?: string | null;
  location?: JobScoreLocation | null;
  created_at?: string | null;
}
