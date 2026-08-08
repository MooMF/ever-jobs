/** Raw response shape from the Boeing jobs API. */
export interface BoeingResponse {
  jobs: BoeingJob[];
  total: number;
}

/** Single job listing returned by the Boeing API. */
export interface BoeingJob {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  department?: string;
  type?: string;
  posted_date?: string;
  url?: string;
  experience_level?: string;
  category?: string;
}
