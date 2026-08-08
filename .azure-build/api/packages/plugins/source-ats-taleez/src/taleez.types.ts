/**
 * TypeScript interfaces for the Taleez (taleez.com) public careers surface.
 *
 * Taleez tenant boards (`{tenant}.taleez.com` / `taleez.com/careers/{tenant}`) are
 * server-rendered shells whose role *list* is client-rendered, so the board itself
 * carries no JSON wire shape to model — the adapter harvests canonical
 * `https://taleez.com/apply/{slug}` anchors from the board HTML. Each role's detail
 * page (`/apply/{slug}`), by contrast, is fully server-rendered and embeds a
 * schema.org `JobPosting` JSON-LD block; the interfaces below model that JSON-LD wire
 * shape and the normalised internal role assembled from it. Everything the adapter
 * reads is optional and defensively narrowed at parse time, so cross-tenant or future
 * layout / markup drift never breaks the parser.
 */

/** A schema.org `PostalAddress` as it may appear inside a `JobPosting.jobLocation`. */
export interface TaleezPostalAddress {
  /** Town / city (`addressLocality`). */
  addressLocality?: string | null;
  /** Region / state / department (`addressRegion`). */
  addressRegion?: string | null;
  /** Country — a name or an ISO code (`addressCountry`), possibly nested as an object. */
  addressCountry?: string | { name?: string | null } | null;
}

/** A schema.org `Place` (one entry of `JobPosting.jobLocation`). */
export interface TaleezPlace {
  '@type'?: string | null;
  /** The role's physical address, when present. */
  address?: TaleezPostalAddress | null;
}

/** A schema.org `Organization` (`JobPosting.hiringOrganization`). */
export interface TaleezOrganization {
  '@type'?: string | null;
  /** The hiring company's display name (the tenant brand). */
  name?: string | null;
  /** Absolute logo URL, when present. */
  logo?: string | null;
}

/** A schema.org `PropertyValue` (`JobPosting.identifier`). */
export interface TaleezIdentifier {
  '@type'?: string | null;
  /** Usually the tenant brand name. */
  name?: string | null;
  /** The role `{slug}` — Taleez's stable per-role ATS id. */
  value?: string | null;
}

/**
 * The schema.org `JobPosting` JSON-LD payload embedded in a Taleez `/apply/{slug}`
 * detail page. All fields are optional and defensively narrowed by the adapter.
 */
export interface TaleezJobPostingLd {
  '@context'?: string | null;
  '@type'?: string | null;
  /** Human-readable job title. */
  title?: string | null;
  /** HTML job-ad body. */
  description?: string | null;
  /** HTML "profile / qualifications" body, appended to the description when present. */
  qualifications?: string | null;
  /** Stable per-role identifier (its `value` is the `{slug}` ATS id). */
  identifier?: TaleezIdentifier | string | null;
  /** ISO 8601 posted date (e.g. `2025-05-16T10:19:50+0200`). */
  datePosted?: string | null;
  /** ISO 8601 expiry date, when present. */
  validThrough?: string | null;
  /** Employment type token(s), e.g. `"FULL_TIME"` or `["FULL_TIME"]`. */
  employmentType?: string | string[] | null;
  /** Remote marker — `TELECOMMUTE` indicates a remote role. */
  jobLocationType?: string | null;
  /** Hiring company (the tenant brand). */
  hiringOrganization?: TaleezOrganization | null;
  /** Role location — a single `Place` or an array of them. */
  jobLocation?: TaleezPlace | TaleezPlace[] | null;
  /** Industry / department label, when present. */
  industry?: string | null;
  /** Canonical role URL, when present. */
  url?: string | null;
}

/**
 * A single role reference harvested from a tenant board: the role `{slug}` plus the
 * canonical detail / apply URL built from it. The detail page is fetched and parsed
 * separately into a `TaleezJobPostingLd`.
 */
export interface TaleezJobLink {
  /** The role `{slug}` — the stable ATS id (e.g. `mdr-analyst-niveau-3-f-m-x-tehtris-cdi`). */
  slug: string;
  /** Absolute canonical detail / apply URL (`https://taleez.com/apply/{slug}`). */
  url: string;
}

/**
 * Normalised view of a single Taleez role, ready to map to a JobPostDto.
 */
export interface TaleezJob {
  /** The role `{slug}` — used as the ATS id. */
  slug: string;

  /** Absolute public detail / apply URL (the canonical `/apply/{slug}` page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Hiring company display name (JSON-LD `hiringOrganization.name`, else tenant fallback). */
  companyName?: string | null;

  /** Description body (HTML), per the request's `descriptionFormat`. */
  description?: string | null;

  /** Structured location parts derived from the JSON-LD `jobLocation.address`. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Department / industry label, when present. */
  department?: string | null;

  /** Employment-type label (normalised from the JSON-LD token). */
  employmentType?: string | null;

  /** Posted date — parsed from `datePosted` → `YYYY-MM-DD`. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working / télétravail. */
  isRemote?: boolean | null;
}
