/**
 * TypeScript interfaces for Jobylon API responses.
 */

export interface JobylonCompany {
  name?: string | null;
  slug?: string | null;
  logo?: string | null;
  website?: string | null;
}

export interface JobylonLocation {
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
  region?: string | null;
  street_address?: string | null;
}

export interface JobylonUrls {
  ad?: string | null;
  apply?: string | null;
}

export interface JobylonSkill {
  label?: string | null;
}

export interface JobylonJob {
  id?: number | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  company?: JobylonCompany | null;
  locations?: JobylonLocation[] | null;
  urls?: JobylonUrls | null;
  from_date?: string | null;
  to_date?: string | null;
  employment_type?: string | null;
  workspace_type?: string | null;
  skills?: JobylonSkill[] | null;
  department?: string | null;
  experience?: string | null;
  language?: string | null;
  function?: string | null;
}
