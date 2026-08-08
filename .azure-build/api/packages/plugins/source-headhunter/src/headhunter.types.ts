export interface HeadhunterVacancy {
  id: string;
  name: string;
  area?: { name?: string };
  salary?: { from?: number; to?: number; currency?: string; gross?: boolean };
  employer?: { name?: string };
  snippet?: { requirement?: string; responsibility?: string };
  alternate_url?: string;
  published_at?: string;
  schedule?: { id?: string };
  work_format?: Array<{ id?: string }>;
}

export interface HeadhunterApiResponse {
  items: HeadhunterVacancy[];
  found: number;
  pages: number;
  per_page: number;
}
