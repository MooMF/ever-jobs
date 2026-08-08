/**
 * TypeScript interfaces for the d.vinci public Job Publication REST API.
 *
 * The list endpoint (`GET /jobPublication/list.json`) returns a JSON array of
 * job-publication objects. Field names mirror the real wire shape, which is
 * `camelCase`. The richer structured data lives in the nested `jobOpening`
 * block; the publication-level fields carry display title, public URLs, and the
 * publication window. A few defensive aliases are modelled so minor cross-tenant
 * drift never breaks the parser.
 */

/** ISO-3166 country reference attached to a structured location. */
export interface DvinciCountry {
  /** Country display name in the requested locale (e.g. "France"). */
  name?: string | null;
  /** ISO-3166 alpha-2 code (e.g. "FR"). */
  isoA2?: string | null;
}

/** Postal-address parts of a structured `jobOpening.locations[]` entry. */
export interface DvinciAddress {
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  address4?: string | null;
  address5?: string | null;
  /** US state name when applicable (usually null for EU tenants). */
  usState?: string | null;
  zipCode?: string | null;
  /** City name — primary structured `city` source. */
  city?: string | null;
  country?: DvinciCountry | string | null;
}

/** A structured location entry under `jobOpening.locations[]`. */
export interface DvinciLocation {
  id?: number | string | null;
  /** Location display label (e.g. "Paris") — fallback for `city`. */
  name?: string | null;
  country?: DvinciCountry | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  additionalInformation?: string | null;
  address?: DvinciAddress | null;
}

/** A category / function tag attached to the underlying job opening. */
export interface DvinciCategory {
  id?: number | string | null;
  internalName?: string | null;
  name?: string | null;
}

/** A simple named reference object (contract period, target group, etc.). */
export interface DvinciNamedRef {
  id?: number | string | null;
  internalName?: string | null;
  name?: string | null;
}

/** The organisational unit that owns the opening. */
export interface DvinciOrgUnit {
  id?: number | string | null;
  name?: string | null;
}

/**
 * The underlying job opening backing a publication. Carries the structured
 * location, department, working times, and creation date.
 */
export interface DvinciJobOpening {
  id?: number | string | null;
  /** Internal opening name (often equal to the publication `position`). */
  name?: string | null;
  type?: string | null;
  /** Function / category tags. */
  categories?: DvinciCategory[] | null;
  reference?: string | null;
  /** Free-text location label (e.g. "Paris", "Remote", "München"). */
  location?: string | null;
  /** Department display name (often null on EU tenants). */
  department?: string | null;
  costUnit?: string | null;
  /** Working-time labels, e.g. ["Full-time"] / ["Vollzeit"]. */
  workingTimes?: Array<DvinciNamedRef | string> | null;
  targetGroups?: Array<DvinciNamedRef | string> | null;
  salaryRange?: string | null;
  /** Structured location entries with country + address parts. */
  locations?: DvinciLocation[] | null;
  /** Contract period reference (e.g. { name: "Permanent" }). */
  contractPeriod?: DvinciNamedRef | string | null;
  earliestEntryDate?: string | null;
  orgUnit?: DvinciOrgUnit | null;
  /** ISO-8601 creation timestamp — used as the publish date. */
  createdDate?: string | null;
}

/** A single active job publication as returned by `/jobPublication/list.json`. */
export interface DvinciJobPublication {
  /** Publication id — the public job-detail page id; used as the ATS id. */
  id?: number | string | null;
  /** Publication locale ("de" / "en" / ...). */
  language?: string | null;
  /** Job display title. */
  position?: string | null;
  /** Browser page title (defensive fallback for `position`). */
  pageTitle?: string | null;
  subtitle?: string | null;
  pageDescription?: string | null;
  /** Canonical public job-detail page URL. */
  jobPublicationURL?: string | null;
  /** Public application-form URL. */
  applicationFormURL?: string | null;
  applicationApplyApiURL?: string | null;
  applicationApplyWhatsAppURL?: string | null;
  /** Publication window start (often null). */
  startDate?: string | null;
  /** Publication window end (often null). */
  endDate?: string | null;

  /** HTML content sections (omitted when `fields=small` is requested). */
  introduction?: string | null;
  tasks?: string | null;
  profile?: string | null;
  weOffer?: string | null;
  closingText?: string | null;

  /** The underlying job opening carrying structured metadata. */
  jobOpening?: DvinciJobOpening | null;
}

/**
 * The list endpoint returns a bare JSON array. A few tenants / proxies wrap it
 * in an envelope; both shapes are modelled so the parser can normalise either.
 */
export type DvinciListResponse =
  | DvinciJobPublication[]
  | { jobPublications?: DvinciJobPublication[] | null }
  | { data?: DvinciJobPublication[] | null };
