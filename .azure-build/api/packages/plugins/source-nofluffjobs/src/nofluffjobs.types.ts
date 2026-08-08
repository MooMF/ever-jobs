/**
 * Shape of a posting object from the NoFluffJobs public JSON API.
 * Polish/CEE tech job board with salary transparency.
 */
export interface NoFluffJobsPosting {
  id: string;
  name: string;
  title: string;
  technology: string;
  category: string;
  seniority: string[];
  location: {
    places: Array<{
      country: { code: string; name: string };
      city: string;
    }>;
    fullyRemote: boolean;
  };
  salary: {
    from: number;
    to: number;
    currency: string;
    type: string;
  };
  posted: number;
  url: string;
  regions: string[];
}
