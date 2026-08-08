export interface JobTechDevResponse {
  total: { value: number };
  hits: JobTechDevHit[];
}

export interface JobTechDevHit {
  id: string;
  headline: string;
  description: { text: string } | null;
  employment_type: { label: string } | null;
  working_hours_type: { label: string } | null;
  employer: { name: string; url: string | null } | null;
  workplace_address: {
    municipality: string | null;
    region: string | null;
    country: string | null;
  } | null;
  application_details: { url: string | null; email: string | null } | null;
  publication_date: string | null;
  last_publication_date: string | null;
  webpage_url: string | null;
  logo_url: string | null;
  salary_description: string | null;
  scope_of_work: { min: number | null; max: number | null } | null;
}
