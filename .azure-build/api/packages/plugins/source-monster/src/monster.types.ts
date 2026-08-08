/**
 * TypeScript interfaces for Monster API responses.
 */

export interface MonsterSearchPayload {
  jobQuery?: {
    query?: string;
    locations?: Array<{
      address?: string;
      country?: string;
    }>;
  };
  jobAdsRequest?: {
    position?: number[];
    placement?: {
      channel?: string;
      location?: string;
      type?: string;
    };
  };
  fingerprintId?: string;
  offset?: number;
  pageSize?: number;
  includeJobs?: string[];
}

export interface MonsterJobResult {
  jobId?: string | null;
  title?: string | null;
  company?: {
    name?: string | null;
  } | null;
  formattedLocation?: string | null;
  stateProvince?: string | null;
  city?: string | null;
  datePosted?: string | null;
  dateRecency?: string | null;
  jobDetailUrl?: string | null;
  description?: string | null;
  salaryInfo?: string | null;
  employmentType?: string | null;
}

export interface MonsterSearchResponse {
  totalSize?: number;
  estimatedTotalSize?: number;
  jobResults?: MonsterJobResult[];
}
