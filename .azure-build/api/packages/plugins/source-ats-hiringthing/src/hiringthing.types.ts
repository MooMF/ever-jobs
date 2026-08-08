/**
 * TypeScript interfaces for HiringThing API responses.
 *
 * HiringThing is a white-label ATS (also branded as ATS Anywhere)
 * used by 500+ companies.
 *
 * @see https://api.hiringthing.com
 */

export interface HiringThingResponse {
  jobs: HiringThingJob[];
}

export interface HiringThingJob {
  id: number | string;
  title: string;
  description: string | null;
  location: string | null;
  department: string | null;
  type: string | null;
  created_at: string | null;
  url: string | null;
  company_name: string | null;
  status: string | null;
  salary: string | null;
  experience: string | null;
}
