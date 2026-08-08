/**
 * Company object nested within an Authentic Jobs listing.
 */
export interface AuthenticJobCompany {
  id: number;
  name: string;
  url: string | null;
  location: string | null;
}

/**
 * Job type object nested within an Authentic Jobs listing.
 */
export interface AuthenticJobType {
  id: number;
  name: string;
}

/**
 * Shape of a single listing returned by the Authentic Jobs API.
 */
export interface AuthenticJob {
  id: number;
  title: string;
  description: string | null;
  perks: string | null;
  howto_apply: string | null;
  post_date: string;
  company: AuthenticJobCompany;
  type: AuthenticJobType;
  telecommuting: boolean;
}

/**
 * Top-level response envelope from the Authentic Jobs API.
 */
export interface AuthenticJobsApiResponse {
  listings: {
    listing: AuthenticJob[];
  };
}
