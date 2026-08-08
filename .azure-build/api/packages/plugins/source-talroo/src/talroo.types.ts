export interface TalrooJob {
  title: string;
  date: string;
  onclick: string;
  company: string;
  city: string[];
  coordinates: string[];
  description: string;
}

export interface TalrooApiResponse {
  total: number;
  start: number;
  count: number;
  jobs: TalrooJob[];
}
