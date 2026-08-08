/**
 * Top-level response from the CareerOneStop Job Search API.
 */
export interface CareerOneStopResponse {
  Jobs: CareerOneStopJob[];
  RecordCount: number;
}

/**
 * A single job returned by the CareerOneStop API.
 */
export interface CareerOneStopJob {
  JvId: string;
  Title: string;
  Company: string;
  URL: string;
  Location: string;
  Description: string;
  DatePosted: string;
}
