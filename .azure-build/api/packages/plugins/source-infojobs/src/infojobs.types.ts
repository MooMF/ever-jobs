export interface InfoJobsOffer {
  id: string;
  title: string;
  province: { id: number; value: string } | null;
  city: string;
  company: { id: number; name: string; url: string } | null;
  link: string;
  salaryMin: { value: string } | null;
  salaryMax: { value: string } | null;
  salaryDescription: string | null;
  experienceMin: { id: number; value: string } | null;
  telpiCallidadOffer: boolean;
  description: string | null;
  multiProvince: boolean;
  published: string;
  updated: string;
  requirementMin: string | null;
  telpiOfferType: string | null;
}

export interface InfoJobsApiResponse {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
  currentResults: number;
  items: InfoJobsOffer[];
}
