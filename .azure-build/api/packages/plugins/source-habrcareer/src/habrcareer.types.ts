export interface HabrcareerVacancy {
  id: number;
  href?: string;
  title: string;
  remoteWork?: boolean;
  salaryQualification?: { title?: string };
  publishedDate?: { date?: string };
  company?: { title?: string; href?: string };
  employment?: string;
  salary?: { from?: number; to?: number; currency?: string; formatted?: string };
  divisions?: Array<{ title?: string }>;
  skills?: Array<{ title?: string }>;
  locations?: Array<{ title?: string }>;
}

export interface HabrcareerApiResponse {
  list: HabrcareerVacancy[];
  meta?: { totalResults?: number };
}
