export interface DuunitoriJobEntry {
  heading: string;
  date_posted: string;
  slug: string;
  municipality_name: string | null;
  company_name: string | null;
  descr: string | null;
  latitude: number | null;
  longitude: number | null;
  export_image_url: string | null;
}

export interface DuunitoriApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DuunitoriJobEntry[];
}
