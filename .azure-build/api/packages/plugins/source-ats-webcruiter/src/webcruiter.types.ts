/**
 * TypeScript interfaces for the Webcruiter public candidate-portal feeds.
 *
 * The advert search (`POST /api/odvert/companysearch/{companyLock}`) returns an
 * envelope whose `Data` array holds the tenant's open roles. Field names mirror
 * the real wire shape, which is `PascalCase`. A handful of `camelCase` aliases
 * are modelled defensively so minor cross-tenant / version drift never breaks
 * the parser.
 */

/** A single open position as returned in the advert-search `Data[]`. */
export interface WebcruiterAdvert {
  /** Stable numeric advert id (string in the payload) — used as the ATS id. */
  Id?: string | number | null;
  id?: string | number | null;

  /** Tenant company-lock id echoed back on each advert. */
  TenantId?: string | number | null;

  /** Employer display name. */
  CompanyName?: string | null;

  /** Job display title. */
  Heading?: string | null;
  /** Secondary heading (workplace + company); used as a department fallback. */
  HeadingNotOverruled?: string | null;

  /** Job description body (plain text / light HTML). */
  Presentation?: string | null;

  /** Employment type label (e.g. "Fast" / "Permanent", "Vikariat"). */
  JobType?: string | null;

  /** Category / function label (e.g. "Helse", "IKT"). */
  JobCategory?: string | null;

  /** Advert language (e.g. "nb", "en"). */
  Language?: string | null;
  /** Full culture code (e.g. "nb-NO"). */
  Culture?: string | null;

  /** Publish date in Webcruiter's `DD.MM.YYYY` display format. */
  PublishedDate?: string | null;
  /** Intranet publish date (same `DD.MM.YYYY` format) — secondary fallback. */
  PublishedIntranetDate?: string | null;

  /** Application deadline as an ISO-8601 timestamp. */
  ApplicationDeadline?: string | null;
  /** Application deadline in `DD.MM.YYYY` display format. */
  ApplyWithinDate?: string | null;

  /** Hours remaining until the deadline (informational; not mapped). */
  HoursLeft?: number | null;

  /** Workplace / location free-text (several increasingly specific variants). */
  Workplace?: string | null;
  Workplace2?: string | null;
  Workplace3?: string | null;
  /** Workplace facet (organisational unit) — used as a department fallback. */
  WorkPlaceFacet?: string | null;
  /** True when the role spans several workplaces. */
  MultipleWorkplaces?: boolean | null;

  /** Advert image URL (not mapped to JobPostDto). */
  PictureUrl?: string | null;

  /**
   * Absolute public job-detail URL, e.g.
   * `https://{companyLock}.webcruiter.no/Main/Recruit/Public/{Id}?language=...`.
   */
  OpenAdvertUrl?: string | null;

  /** Relative apply URL, e.g. `/{culture}/cv?advertId={Id}&...`. */
  ApplyUrl?: string | null;

  /** Visibility flags (informational). */
  IsInternet?: boolean | null;
  IsIntranet?: boolean | null;
}

/** A facet bucket carried in the search envelope's `Facets` map. */
export interface WebcruiterFacetEntry {
  count?: number | null;
  value?: string | null;
}

/** Top-level envelope returned by `POST /api/odvert/companysearch/{companyLock}`. */
export interface WebcruiterAdvertSearchResponse {
  /** Total open roles for the tenant (independent of the requested page size). */
  Total?: number | null;
  /** The adverts for the requested page. */
  Data?: WebcruiterAdvert[] | null;
  /** Category / workplace facets — not job data; ignored by the mapper. */
  Facets?: Record<string, WebcruiterFacetEntry[]> | null;
  /** Server-side filter echo (diagnostic; not used). */
  LastFilterQuery?: string | null;
  /** Aggregate stats (usually null; not used). */
  Aggregates?: unknown | null;
}

/** Top-level envelope returned by `GET /api/company/companymeta/{companyLock}`. */
export interface WebcruiterCompanyMeta {
  /** Tenant company-lock id. */
  TenantId?: string | number | null;
  CompanyId?: string | number | null;
  /** Tenant display name — the preferred `companyName` source. */
  CompanyName?: string | null;
  /** Tenant logo URL (not mapped to JobPostDto). */
  CompanyLogoLibUrl?: string | null;
  /** Whether the tenant exposes the advert-search surface. */
  ShowAdvertSearch?: boolean | null;
}

/** Paging body posted to the advert-search endpoint (paging only). */
export interface WebcruiterSearchBody {
  take: number;
  skip: number;
}
