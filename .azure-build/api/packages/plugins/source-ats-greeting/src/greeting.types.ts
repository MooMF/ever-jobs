/**
 * TypeScript interfaces for the Greeting public careers surface.
 *
 * Greeting tenant career sites (`{tenant}.career.greetinghr.com`) are Next.js apps whose
 * landing page embeds the full open-roles set in the standard `__NEXT_DATA__` script tag
 * as a React-Query "dehydrated state" (a list of pre-fetched queries). The adapter
 * extracts and parses that embedded JSON. The interfaces below describe the subset of the
 * wire shape the adapter reads — the `__NEXT_DATA__` envelope, the `["openings"]` list
 * query, the `getCareerBootInfo` query (for the tenant `workspaceId`), and the detail-API
 * response — plus the normalised internal role assembled from them. Everything the adapter
 * reads is optional and defensively narrowed at parse time, so cross-tenant or future-shape
 * drift never breaks the parser.
 */

/** A single React-Query dehydrated query as embedded in `__NEXT_DATA__`. */
export interface GreetingDehydratedQuery {
  /** The query key — e.g. `["openings"]` or `["publicCareer","getCareerBootInfo",{…}]`. */
  queryKey?: unknown;
  /** The query state, whose `data` holds the pre-fetched payload. */
  state?: {
    data?: unknown;
  } | null;
}

/** The React-Query dehydrated-state container embedded in the page props. */
export interface GreetingDehydratedState {
  /** The pre-fetched queries (openings list, boot info, page detail, filters, …). */
  queries?: GreetingDehydratedQuery[] | null;
}

/** The Next.js page props embedded in `__NEXT_DATA__`. */
export interface GreetingPageProps {
  /** The React-Query dehydrated state holding the pre-fetched queries. */
  dehydratedState?: GreetingDehydratedState | null;
  /** The career host (e.g. `ablelabs.career.greetinghr.com`). */
  host?: string | null;
  /** The tenant sub-domain label (e.g. `ablelabs`). */
  subDomain?: string | null;
}

/** The top-level `__NEXT_DATA__` envelope (only the fields the adapter reads). */
export interface GreetingNextData {
  /** The Next.js build id (unused by the adapter; present for completeness). */
  buildId?: string | null;
  /** The Next.js page props carrying the dehydrated query state. */
  props?: {
    pageProps?: GreetingPageProps | null;
  } | null;
}

/** Occupation / job-family descriptor on an opening's job position. */
export interface GreetingWorkspaceOccupation {
  /** Localised occupation label (e.g. `소프트웨어`). Used as the role department. */
  occupation?: string | null;
}

/** Work-place descriptor on an opening's job position. */
export interface GreetingWorkspacePlace {
  /** Short place label (e.g. the office / city name). */
  location?: string | null;
  /** Full free-text address, when present. */
  place?: string | null;
  /** Floor / suite detail, when present. */
  detailPlace?: string | null;
  /** True when the place is flagged as work-from-home / remote. */
  workFromHome?: boolean | null;
}

/** Employment-type descriptor on an opening's job position. */
export interface GreetingJobPositionEmployment {
  /** Employment-type enum token (e.g. `FULL_TIME_WORKER`). */
  employmentType?: string | null;
}

/** A single job position attached to an opening. */
export interface GreetingJobPosition {
  /** Internal job-position id. */
  id?: number | string | null;
  /** Occupation / job-family descriptor. */
  workspaceOccupation?: GreetingWorkspaceOccupation | null;
  /** Work-place descriptor (location / address / remote flag). */
  workspacePlace?: GreetingWorkspacePlace | null;
  /** Employment-type descriptor. */
  jobPositionEmployment?: GreetingJobPositionEmployment | null;
}

/** The job-position wrapper on an opening (carries the list of positions). */
export interface GreetingOpeningJobPosition {
  /** The opening's job positions (occupation / place / employment). */
  openingJobPositions?: GreetingJobPosition[] | null;
}

/** The owning group / company descriptor on an opening. */
export interface GreetingGroup {
  /** Company / group display name (e.g. `에이블랩스`). */
  name?: string | null;
  /** Group logo image URL. */
  imageUrl?: string | null;
}

/**
 * A single open role as embedded in the landing page's `["openings"]` dehydrated query.
 * Only the fields the adapter consumes are modelled; all are optional and defensively
 * narrowed.
 */
export interface GreetingOpening {
  /** Stable per-role id and the final segment of the canonical detail / apply URL. */
  openingId?: number | string | null;
  /** Default (untranslated) job title. */
  title?: string | null;
  /** True when the role is deployed / publicly visible. */
  deploy?: boolean | null;
  /** True when the role is pinned to the top of the board. */
  fixed?: boolean | null;
  /** ISO open / publish timestamp, when present. */
  openDate?: string | null;
  /** ISO application-deadline timestamp, when present. */
  dueDate?: string | null;
  /** Owning group / company descriptor. */
  group?: GreetingGroup | null;
  /** The opening's job-position wrapper (occupation / place / employment). */
  openingJobPosition?: GreetingOpeningJobPosition | null;
}

/** The `openingsInfo` block of the detail-API response (carries the HTML body). */
export interface GreetingOpeningInfo {
  /** Per-role id (echoes the listing `openingId`). */
  openingId?: number | string | null;
  /** Role status (e.g. `OPEN`). */
  status?: string | null;
  /** Role title. */
  title?: string | null;
  /** HTML job-ad body (the rich description). */
  detail?: string | null;
}

/** The detail-API response payload (`data` of `getOpeningById`). */
export interface GreetingOpeningDetailData {
  /** The role info block carrying the HTML description. */
  openingsInfo?: GreetingOpeningInfo | null;
  /** The owning group / company descriptor. */
  groupInfo?: GreetingGroup | null;
}

/** The detail-API envelope (`{ success, data, message, errorCode }`). */
export interface GreetingOpeningDetailResponse {
  /** True when the request succeeded. */
  success?: boolean | null;
  /** The detail payload. */
  data?: GreetingOpeningDetailData | null;
  /** Optional server message. */
  message?: string | null;
}

/**
 * Normalised view of a single Greeting role, ready to map to a JobPostDto.
 */
export interface GreetingJob {
  /** Stable ATS id (the opening `openingId`). */
  atsId: string;

  /** Absolute public detail URL (the canonical career-site job-ad page). */
  url: string;

  /** Absolute public apply URL. */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (from the opening `group.name`, else the slug). */
  companyName?: string | null;

  /** Structured location parts derived from the raw place text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw location / place string, used for remote detection. */
  locationText?: string | null;

  /** HTML job-ad body (the richest description available), when present. */
  descriptionHtml?: string | null;

  /** Department / occupation label. */
  department?: string | null;

  /** Human-readable employment-type label, when derivable. */
  employmentType?: string | null;

  /** Posted date — parsed from `openDate`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / work-from-home. */
  isRemote?: boolean | null;
}
