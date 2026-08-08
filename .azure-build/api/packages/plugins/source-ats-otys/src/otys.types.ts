/**
 * TypeScript interfaces for the OTYS recruitment-technology public careers surface.
 *
 * OTYS's candidate-facing recruitment site (`/vacatures/vacature-{slug}-{id}-{n}.html`)
 * is server-rendered HTML, so there is no single guaranteed JSON wire shape to model.
 * The adapter parses the index HTML for the canonical vacancy links and then parses
 * each detail page — preferring a schema.org `JobPosting` JSON-LD block (OTYS feeds
 * Google for Jobs) and falling back to `og:` meta / the page `<title>` / body HTML.
 * The interfaces below describe the link fragment parsed from the index, the loosely
 * typed JSON-LD `JobPosting` shape, and the normalised internal role assembled from
 * them. Everything the adapter reads is optional and defensively narrowed at parse
 * time, so cross-tenant or future-layout drift never breaks the parser.
 */

/**
 * A single vacancy link as parsed out of the index HTML, assembled from the
 * canonical OTYS recruitment-site URL `/vacatures/vacature-{slug}-{id}-{websiteId}.html`.
 */
export interface OtysJobLink {
  /** Numeric OTYS vacancy id — the `{id}` URL segment (e.g. `1481738`). The ATS id. */
  id: string;
  /** Title slug — the `{slug}` URL segment (e.g. `senior-accountmanager-amsterdam`). */
  slug?: string | null;
  /** OTYS portal/website number — the trailing `{websiteId}` URL segment (e.g. `11`). */
  websiteId?: string | null;
  /** Absolute canonical detail / apply URL built from the host + parsed path. */
  url: string;
}

/**
 * Loosely typed schema.org `JobPosting` JSON-LD shape, as embedded in an OTYS
 * recruitment-site detail page when Google-for-Jobs structured data is enabled. All
 * fields are optional and defensively narrowed; nested objects may be missing.
 */
export interface OtysJobPostingLd {
  '@type'?: string | string[];
  /** Job title. */
  title?: string | null;
  /** Job-ad body, typically HTML. */
  description?: string | null;
  /** ISO date the role was published (e.g. `2026-05-20`). */
  datePosted?: string | null;
  /** Schema.org employment-type token(s) (e.g. `FULL_TIME`) — string or array. */
  employmentType?: string | string[] | null;
  /** `TELECOMMUTE` for remote roles. */
  jobLocationType?: string | null;
  /** Industry / category, mapped to `department` when present. */
  industry?: string | null;
  /** Canonical apply / detail URL. */
  url?: string | null;
  /** Hiring organisation, carrying the tenant brand name when present. */
  hiringOrganization?: {
    name?: string | null;
  } | null;
  /** Structured location — may be a single object or an array of objects. */
  jobLocation?: OtysJobLocationLd | OtysJobLocationLd[] | null;
}

/** A schema.org `jobLocation` entry (`{ address: { … } }`). */
export interface OtysJobLocationLd {
  address?: {
    addressLocality?: string | null;
    addressRegion?: string | null;
    addressCountry?: string | { name?: string | null } | null;
  } | null;
}

/**
 * Normalised view of a single OTYS vacancy, ready to map to a JobPostDto.
 */
export interface OtysJob {
  /** Numeric OTYS vacancy id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the canonical recruitment-site vacancy page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (JSON-LD `hiringOrganization.name`, else host-derived). */
  companyName?: string | null;

  /** Structured location parts derived from JSON-LD address or free-text location. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Job-ad body / description text (HTML when available). */
  description?: string | null;

  /** Department / category (from JSON-LD `industry`), when present. */
  department?: string | null;

  /** Employment-type label (from JSON-LD `employmentType`), normalised. */
  employmentType?: string | null;

  /** Posted date — parsed from JSON-LD `datePosted`, when an absolute date is available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
