export interface MycareersfutureJob {
  uuid: string;
  title?: string;
  description?: string;
  sourceCode?: string;
  company?: { name?: string };
  salary?: { minimum?: number; maximum?: number; currency?: string };
  location?: { name?: string };
  postedDate?: string;
}

export interface MycareersfutureApiResponse {
  results: MycareersfutureJob[];
}
