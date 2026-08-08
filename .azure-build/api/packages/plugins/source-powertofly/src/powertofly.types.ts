/**
 * Shape of a job item from the PowerToFly JSON RSS endpoint.
 * PowerToFly is a diversity-focused job board.
 */
export interface PowertoflyItem {
  title?: string;
  description?: string;
  link?: string;
  job_location?: string;
  published_on?: string;
  categories?: string[];
  type?: string;
  guid?: string;
}

export interface PowertoflyApiResponse {
  items?: PowertoflyItem[];
  status?: string;
}
