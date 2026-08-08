/**
 * TypeScript interfaces for the Ceridian Dayforce HCM candidate-portal job feed.
 *
 * Dayforce exposes two public surfaces with different field casings:
 *   - the modern geo search feed (`/api/geo/{client}/jobposting/search`) uses
 *     camelCase fields (`jobPostingId`, `jobTitle`, `postingLocations`, …);
 *   - the documented RESTful feed uses PascalCase (`Title`, `JobDetailsUrl`,
 *     `ParentRequisitionCode`, `City`, …).
 *
 * Both spellings are modelled so the parser can read either response without
 * guessing which surface a given tenant emits.
 */

/** A structured location entry from the geo feed's `postingLocations` array. */
export interface DayforcePostingLocation {
  address?: string | null;
  addressLine1?: string | null;
  AddressLine1?: string | null;
  city?: string | null;
  City?: string | null;
  state?: string | null;
  stateCode?: string | null;
  State?: string | null;
  country?: string | null;
  countryCode?: string | null;
  Country?: string | null;
  postalCode?: string | null;
  PostalCode?: string | null;
  isRemote?: boolean | null;
}

/** A single job posting as returned by either Dayforce public feed. */
export interface DayforceJobPosting {
  /** Unique posting id (geo feed). */
  jobPostingId?: string | number | null;
  /** Requisition id (geo feed). */
  jobReqId?: string | number | null;
  /** Generic id fallbacks observed across tenants. */
  id?: string | number | null;
  Id?: string | number | null;

  /** Title — camelCase (geo) and PascalCase (RESTful). */
  jobTitle?: string | null;
  Title?: string | null;
  title?: string | null;

  /** HTML job description. */
  jobDescription?: string | null;
  Description?: string | null;
  description?: string | null;

  /** Requisition / reference codes (PascalCase RESTful feed). */
  ParentRequisitionCode?: string | number | null;
  ReferenceNumber?: string | number | null;

  /** Canonical detail/apply URLs — may be absolute or root-relative. */
  JobDetailsUrl?: string | null;
  jobDetailsUrl?: string | null;
  ApplyUrl?: string | null;
  applyUrl?: string | null;

  /** Structured location list (geo feed); first entry is primary. */
  postingLocations?: DayforcePostingLocation[] | null;
  PostingLocations?: DayforcePostingLocation[] | null;

  /** Flat location fields (RESTful feed). */
  City?: string | null;
  city?: string | null;
  State?: string | null;
  state?: string | null;
  Country?: string | null;
  country?: string | null;
  PostalCode?: string | null;

  /** Department / function / category. */
  JobFunction?: string | null;
  jobFunction?: string | null;
  department?: string | null;
  Department?: string | null;
  category?: string | null;

  /** Employment / job type. */
  JobType?: string | null;
  jobType?: string | null;
  EmploymentIndicator?: string | null;

  /** Remote / telecommute encoding. */
  TelecommutePercentage?: number | string | null;
  TravelRequired?: boolean | string | null;
  isRemote?: boolean | null;

  /** Company / client name fields. */
  CompanyName?: string | null;
  companyName?: string | null;
  ClientSiteName?: string | null;
  ParentCompanyName?: string | null;

  /** Posted / updated timestamps — ISO string, epoch s, or epoch ms. */
  postingStartTimestampUTC?: number | string | null;
  postingExpiryTimestampUTC?: number | string | null;
  DatePosted?: number | string | null;
  datePosted?: number | string | null;
  LastUpdated?: number | string | null;

  /** Locale code for building detail URLs. */
  CultureCode?: string | null;
  cultureCode?: string | null;

  /** Evergreen (always-open) flag. */
  isEvergreen?: boolean | null;
}

/** Geo search (`/api/geo/{client}/jobposting/search`) response envelope. */
export interface DayforceSearchResponse {
  jobPostings?: DayforceJobPosting[] | null;
  JobPostings?: DayforceJobPosting[] | null;
  /** Total postings available for this tenant/board. */
  maxCount?: number | null;
  MaxCount?: number | null;
  /** Postings returned in the current page. */
  count?: number | null;
  Count?: number | null;
}

/** Request body for the geo search endpoint. */
export interface DayforceSearchRequest {
  clientNamespace: string;
  jobBoardCode: string;
  cultureCode: string;
  distanceUnit: number;
  paginationStart: number;
}
