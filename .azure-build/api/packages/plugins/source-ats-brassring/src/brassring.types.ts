/**
 * TypeScript interfaces for the BrassRing (IBM Kenexa) public Talent Gateway
 * surface.
 *
 * BrassRing does not expose a sub-domain-addressed JSON feed; a tenant is
 * addressed by a `partnerid` + `siteid` pair on the shared `sjobs.brassring.com`
 * host, and the jobs index is a client-rendered SPA. The adapter therefore calls
 * the portal's own AJAX search endpoint (`/TgNewUI/Search/Ajax/MatchedJobs`),
 * which returns a JSON envelope of matched roles, and (when present) enriches each
 * role from its server-rendered detail page's schema.org `JobPosting` JSON-LD. The
 * interfaces below model the normalised, parsed shape the adapter extracts from
 * those documents. Field names mirror the BrassRing/Kenexa wire meaning; a handful
 * of aliases are modelled defensively so minor cross-tenant or future-version
 * payload drift never breaks the parser.
 */

/** The resolved `partnerid` + `siteid` pair that addresses a BrassRing tenant. */
export interface BrassRingTenant {
  /** BrassRing `partnerid` query parameter. */
  partnerId: string;
  /** BrassRing `siteid` query parameter. */
  siteId: string;
}

/**
 * A single role object inside the MatchedJobs `Jobs[]` envelope. Only the fields
 * the adapter consumes are typed; everything is optional and defensively narrowed
 * at parse time, since the rendered payload varies by tenant/version. Several
 * common BrassRing/Kenexa spellings of the same field are modelled as aliases.
 */
export interface BrassRingJobRaw {
  /** Display title (`Title` / `JobTitle` / `Jobtitle`). */
  Title?: string | null;
  JobTitle?: string | null;
  Jobtitle?: string | null;

  /** Numeric / internal job id (`Jobid` / `JobId` / `JobnoteId`). */
  Jobid?: string | number | null;
  JobId?: string | number | null;

  /** Requisition number (`Autoreqid` / `AutoReqId` / `Areq` — `…BR`-suffixed). */
  Autoreqid?: string | null;
  AutoReqId?: string | null;
  Areq?: string | null;

  /** Apply / detail URL when the envelope advertises one. */
  JobUrl?: string | null;
  Joburl?: string | null;
  Url?: string | null;

  /** Free-text location label (`Location` / `JobLocation` / `Locations`). */
  Location?: string | null;
  JobLocation?: string | null;
  Locations?: string | null;

  /** City / region / country parts, when the envelope splits them out. */
  City?: string | null;
  State?: string | null;
  Country?: string | null;

  /** Posting date (`PostingDate` / `PostedDate` / `DatePosted`). */
  PostingDate?: string | null;
  PostedDate?: string | null;
  DatePosted?: string | null;

  /** Department / category / function label, when present. */
  Department?: string | null;
  Category?: string | null;
  JobCategory?: string | null;

  /** Employment-type / schedule label, when present. */
  EmploymentType?: string | null;
  JobType?: string | null;
  Schedule?: string | null;

  /** Short description / summary blob, when the listing carries one. */
  Description?: string | null;
  JobDescription?: string | null;
  Summary?: string | null;
}

/**
 * The MatchedJobs JSON envelope returned by the portal's AJAX search endpoint.
 * `Jobs` holds the page of roles; `JobsCount` is the tenant's total open-role
 * count (used to bound client-side paging). All fields are optional/defensive.
 */
export interface BrassRingMatchedJobsResponse {
  /** Page of matched roles. */
  Jobs?: BrassRingJobRaw[] | null;
  /** Total open-role count across all pages, when present. */
  JobsCount?: number | string | null;
  /** Facet buckets (unused, modelled so the envelope type is faithful). */
  Facets?: unknown;
  /** Sort options (unused). */
  SortFields?: unknown;
}

/** schema.org `PostalAddress` carried inside a detail-page `JobPosting.jobLocation`. */
export interface BrassRingPostalAddress {
  addressLocality?: string | null;
  addressRegion?: string | null;
  addressCountry?: string | { name?: string | null } | null;
}

/** schema.org `Place` carried inside a detail-page `JobPosting.jobLocation`. */
export interface BrassRingJobLocation {
  address?: BrassRingPostalAddress | null;
}

/** schema.org `Organization` carried inside a `JobPosting.hiringOrganization`. */
export interface BrassRingHiringOrganization {
  name?: string | null;
}

/**
 * The schema.org `JobPosting` JSON-LD object some tenants pre-render on the detail
 * page. Only the fields the adapter consumes are typed; everything is optional and
 * defensively narrowed at parse time.
 */
export interface BrassRingJobPosting {
  '@type'?: string | string[] | null;
  title?: string | null;
  description?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType?: string | string[] | null;
  industry?: string | null;
  jobLocationType?: string | null;
  hiringOrganization?: BrassRingHiringOrganization | string | null;
  jobLocation?: BrassRingJobLocation | BrassRingJobLocation[] | null;
  url?: string | null;
}

/**
 * Normalised view of a single BrassRing role, assembled from its MatchedJobs
 * envelope entry (with detail-page JSON-LD as an optional enrichment).
 */
export interface BrassRingJob {
  /** Stable ATS id — the requisition (`Areq`) when present, else the numeric job id. */
  atsId: string;

  /** Absolute public detail / apply URL. */
  url: string;
  /** Canonical URL from JSON-LD `url`, when present. */
  canonicalUrl?: string | null;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (from JSON-LD `hiringOrganization.name`). */
  companyName?: string | null;

  /** Full job-ad body as HTML (from JSON-LD `description`), when available. */
  descriptionHtml?: string | null;
  /** Plain-text body fallback (from the listing `Description`/`Summary`). */
  description?: string | null;

  /** Structured location parts. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label. */
  employmentType?: string | null;

  /** Department / category label, when present. */
  department?: string | null;

  /** Posted date — `datePosted` from JSON-LD, else the listing posting date. */
  datePosted?: string | null;

  /** True when the role advertises remote / work-from-home. */
  isRemote?: boolean | null;
}
