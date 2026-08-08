export interface JobsdbSearchResult {
  data: JobsdbJob[];
  totalCount?: number;
}

export interface JobsdbJob {
  id: string;
  title: string;
  companyName?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  listingDate?: string;
  teaser?: string;
  jobUrl?: string;
  description?: string;
  workType?: string;
  isRemote?: boolean;
}
