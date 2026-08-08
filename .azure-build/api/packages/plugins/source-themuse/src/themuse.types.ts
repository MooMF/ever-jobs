export interface TheMuseResponse {
  page: number;
  page_count: number;
  total: number;
  results: TheMuseJob[];
}

export interface TheMuseJob {
  id: number;
  name: string;
  type: string;
  short_name: string;
  company: { id: number; short_name: string; name: string } | null;
  locations: { name: string }[];
  categories: { name: string }[];
  levels: { name: string; short_name: string }[];
  refs: { landing_page: string };
  publication_date: string;
  contents: string;
  model_type: string;
}
