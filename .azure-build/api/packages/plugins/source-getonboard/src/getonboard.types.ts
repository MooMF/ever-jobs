export interface GetOnBoardSearchResponse {
  data: GetOnBoardJob[];
  meta?: {
    current_page: number;
    total_pages: number;
    total_results: number;
  };
}

export interface GetOnBoardJob {
  id: string;
  type: string;
  attributes: {
    title: string;
    description: string | null;
    description_headline: string | null;
    company: string | null;
    logo: string | null;
    min_salary: number | null;
    max_salary: number | null;
    remote: boolean;
    modality: string | null;
    seniority: string | null;
    category_name: string | null;
    published_at: number | null;
    countries: string[];
    location_cities: string[];
    tags: string[];
    tenure_type: string | null;
  };
  links: {
    public_url: string;
  };
}
