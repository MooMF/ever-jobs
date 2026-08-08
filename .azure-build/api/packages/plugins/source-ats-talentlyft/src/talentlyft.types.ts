/**
 * TypeScript interfaces for TalentLyft API responses.
 */

export interface TalentLyftJob {
  Id?: number | string | null;
  Title?: string | null;
  Description?: string | null;
  Department?: string | null;
  Location?: string | null;
  CreatedAt?: string | null;
  Status?: string | null;
  Url?: string | null;
}

export interface TalentLyftResponse {
  Count?: number | null;
  Page?: number | null;
  PerPage?: number | null;
  Pages?: number | null;
  Results?: TalentLyftJob[] | null;
}
