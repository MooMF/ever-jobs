export interface NoDeskJob {
  id: string | number;
  title: string;
  company: string;
  company_logo?: string;
  url: string;
  description?: string;
  location?: string;
  category?: string;
  tags?: string[];
  date?: string;
  published_at?: string;
  is_remote?: boolean;
}
