/**
 * TypeScript interfaces for the Cornerstone OnDemand (CSOD) public career-site
 * job-search API (`POST {cloud}/rec-job-search/external/jobs`).
 *
 * Field names mirror the real wire shape. CSOD has revised these payloads over
 * time, so both the current camelCase spellings and a few historical fallbacks
 * are modelled defensively; the service reads whichever is present rather than
 * guessing.
 */

/** Bootstrap context scraped from the public career-site HTML page. */
export interface CornerstoneBootstrap {
  /** Anonymous JWT used as the `Authorization: Bearer` token for the search API. */
  token: string;
  /** Regional cloud API host, e.g. `https://us.api.csod.com`. */
  cloudHost: string;
}

/** A single location entry attached to a requisition. */
export interface CornerstoneLocation {
  city?: string | null;
  state?: string | null;
  stateName?: string | null;
  country?: string | null;
  countryName?: string | null;
  countryCode?: string | null;
  /** Some payloads collapse the whole location into a display string. */
  displayName?: string | null;
  formattedAddress?: string | null;
}

/** A single requisition as returned by `/rec-job-search/external/jobs`. */
export interface CornerstoneRequisition {
  /** Primary requisition id (trailing segment of the canonical URL). */
  requisitionId?: string | number | null;
  /** Tenant-facing reference / external id, when distinct from requisitionId. */
  referenceNumber?: string | null;
  externalId?: string | null;

  /** Display title; `jobTitle`/`title` are historical fallbacks. */
  displayJobTitle?: string | null;
  jobTitle?: string | null;
  title?: string | null;

  /** HTML job description (external candidate-facing copy). */
  externalDescription?: string | null;
  description?: string | null;
  /** Optional qualifications block, appended to the description when present. */
  externalQualifications?: string | null;
  qualifications?: string | null;

  /** Location array (first entry treated as primary) or a single object. */
  locations?: CornerstoneLocation[] | null;
  location?: CornerstoneLocation | string | null;
  displayLocation?: string | null;

  /** Department / division / business unit. */
  division?: string | null;
  department?: string | null;
  businessUnit?: string | null;

  /** Employment type (Full-Time, Part-Time, Contract, …). */
  employmentType?: string | null;
  employmentStatus?: string | null;

  /** Remote / work-arrangement encoding. */
  workplaceType?: string | null;
  remoteFlag?: boolean | null;
  isRemote?: boolean | null;

  /** Posting timestamps — ISO string, epoch seconds, or epoch ms. */
  postingEffectiveDate?: string | number | null;
  postingStartDate?: string | number | null;
  postedDate?: string | number | null;
  postingExpirationDate?: string | number | null;
}

/** Search response envelope; payload sits under `data` on the current API. */
export interface CornerstoneSearchResponse {
  data?: {
    requisitions?: CornerstoneRequisition[] | null;
    totalCount?: number | null;
  } | null;
  /** Older/flat shapes occasionally surface these at the top level. */
  requisitions?: CornerstoneRequisition[] | null;
  totalCount?: number | null;
}
