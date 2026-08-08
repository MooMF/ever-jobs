export interface JobstreetResponse {
  data?: JobstreetJob[];
  jobs?: JobstreetJob[];
  total?: number;
}

export interface JobstreetJob {
  id: string | number;
  title: string;
  advertiser?: { description: string };
  companyName?: string;
  company?: string;
  jobUrl?: string;
  listingUrl?: string;
  teaser?: string;
  description?: string;
  location?: string;
  locationWhereValue?: string;
  salary?: string;
  salaryLabel?: string;
  workType?: string;
  classification?: { description: string };
  listingDate?: string;
  isRemote?: boolean;
}
