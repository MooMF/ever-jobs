/**
 * TypeScript interfaces for UKG Pro Recruiting (UltiPro) career site API responses.
 */

export interface UkgResponse {
  opportunities?: UkgJob[];
  totalCount?: number;
}

export interface UkgJob {
  /** Unique opportunity / job posting ID */
  id?: string | null;
  /** Job title */
  title?: string | null;
  /** Job description (HTML) */
  description?: string | null;
  /** Short description / summary */
  shortDescription?: string | null;
  /** Department name */
  department?: string | null;
  /** Category */
  category?: string | null;
  /** Location */
  location?: UkgLocation | null;
  /** Multiple locations */
  locations?: UkgLocation[] | null;
  /** Job type / employment type (Full-Time, Part-Time, etc.) */
  jobType?: string | null;
  /** Shift / schedule */
  shift?: string | null;
  /** Date posted (ISO format) */
  postedDate?: string | null;
  /** Last updated date */
  updatedDate?: string | null;
  /** Application URL */
  applyUrl?: string | null;
  /** Company name */
  companyName?: string | null;
  /** Requisition number */
  requisitionNumber?: string | null;
}

export interface UkgLocation {
  /** City */
  city?: string | null;
  /** State / province */
  state?: string | null;
  /** Country */
  country?: string | null;
  /** Full formatted address */
  formattedAddress?: string | null;
}
