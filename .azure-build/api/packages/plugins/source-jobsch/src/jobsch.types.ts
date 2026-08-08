export interface JobsChDocument {
  job_id: string;
  title: string;
  slug: string;
  company_name: string | null;
  company_slug: string | null;
  preview: string | null;
  publication_date: string | null;
  initial_publication_date: string | null;
  tags: { type: string; value_min?: number; value_max?: number }[];
  language_skills: { language: string; level: number }[];
  _links: {
    detail_en?: { href: string };
    detail_de?: { href: string };
    detail_fr?: { href: string };
  };
}

export interface JobsChApiResponse {
  start: number;
  rows: number;
  num_pages: number;
  current_page: number;
  documents: JobsChDocument[];
}
