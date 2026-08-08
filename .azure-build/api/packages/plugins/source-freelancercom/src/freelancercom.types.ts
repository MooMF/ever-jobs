export interface FreelancerComResponse {
  status: string;
  result: {
    projects: FreelancerComProject[];
    total_count: number;
  };
}

export interface FreelancerComProject {
  id: number;
  title: string;
  description: string | null;
  seo_url: string | null;
  status: string;
  type: string;
  currency: {
    code: string;
    sign: string;
  } | null;
  budget: {
    minimum: number | null;
    maximum: number | null;
  } | null;
  bid_stats: {
    bid_count: number;
    bid_avg: number;
  } | null;
  time_submitted: number | null;
  time_updated: number | null;
  language: string | null;
  location: {
    country: { name: string } | null;
    city: string | null;
  } | null;
  hourly_project_info?: {
    commitment?: { hours: number; interval: string };
  };
  owner?: {
    username: string;
    display_name: string;
    avatar_cdn: string | null;
  };
}
