export interface JoinRiseResponse {
  result: {
    jobs: JoinRiseJob[];
    count: number;
  };
}

export interface JoinRiseJob {
  _id: string;
  title: string;
  url: string;
  locationAddress: string | null;
  type: string | null;
  department: string | null;
  seniority: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  skills_suggest: string[];
  owner: {
    companyName: string | null;
    photo: string | null;
    rating: number | null;
    teamSize: string | null;
    funding: string | null;
    sector: string | null;
  } | null;
  descriptionBreakdown: {
    oneSentenceJobSummary: string | null;
    salaryRangeMinYearly: number | null;
    salaryRangeMaxYearly: number | null;
    employmentType: string | null;
    workModel: string | null;
    keywords: string[];
  } | null;
}
