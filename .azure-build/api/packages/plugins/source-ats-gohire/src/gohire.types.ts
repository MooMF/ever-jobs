/**
 * TypeScript interfaces for the GoHire public careers jobs API.
 *
 * The list feed (`GET https://api2.gohire.io/widget-jobs/{clientHash}`) returns
 * an envelope object with a `jobs` array; the detail feed
 * (`GET https://api.gohire.io/widget-job?clientHash={hash}&jobId={id}`) returns
 * a single richer object. Field names mirror the real wire shape, which is
 * camelCase. Optional aliases are modelled defensively so minor cross-tenant
 * drift never breaks the parser.
 */

/** One open role as returned in the list-feed `jobs` array. */
export interface GoHireListJob {
  /** Numeric job id — used as the ATS id and the detail-feed `jobId`. */
  id?: number | string | null;

  /** Role title. */
  title?: string | null;

  /** Short/empty in the list feed; the detail feed carries the full HTML. */
  description?: string | null;

  /** Free-text location label (e.g. "Manila, Philippines"). */
  location?: string | null;

  /** Free-text salary label (e.g. "150 - 175 PHP Per hour"). */
  salary?: string | null;

  /** Employment-type label (e.g. "Contract", "Full-time", "Freelance"). */
  type?: string | null;

  /** Human-readable posted date (e.g. "28 May, 2026"). */
  date?: string | null;

  /** Absolute public job-page URL on `jobs.gohire.io`. */
  link?: string | null;
}

/** The list-feed envelope wrapping a tenant's open roles. */
export interface GoHireJobsResponse {
  /** 1 when the tenant exposes a general-application pool. */
  generalApplication?: number | null;
  /** General-application pool id (unused in mapping). */
  generalPoolID?: number | null;
  /** Optional board template name (unused in mapping). */
  template?: string | null;
  /** Optional board brand colour (unused in mapping). */
  colour?: string | null;
  /** The tenant's open roles. */
  jobs?: GoHireListJob[] | null;
  /** Board language code (e.g. "en"). */
  language?: string | null;
}

/** The employer block embedded in the detail feed. */
export interface GoHireClient {
  id?: number | string | null;
  /** Employer display name (e.g. "Getava") → companyName. */
  name?: string | null;
  /** Employer country label. */
  country?: string | null;
}

/** Structured employment-type object on the detail feed. */
export interface GoHireType {
  id?: number | string | null;
  name?: string | null;
}

/** Structured country object on the detail feed. */
export interface GoHireCountry {
  id?: number | string | null;
  /** ISO-3166 alpha-2 code (e.g. "PH"). */
  code?: string | null;
  /** Country display name (e.g. "Philippines"). */
  name?: string | null;
}

/** A single rich job as returned by `/widget-job`. */
export interface GoHireJobDetail {
  /** Numeric job id (matches the list-feed `id`). */
  id?: number | string | null;

  /** Employer metadata. */
  client?: GoHireClient | null;

  /** Role title. */
  title?: string | null;

  /** Structured employment type. */
  type?: GoHireType | string | null;

  /** Structured location parts. */
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  country?: GoHireCountry | string | null;

  /** Full HTML job description. */
  description?: string | null;

  /** Free-text salary label. */
  salary?: string | null;

  /** 1 when this id is the tenant's general-application pool. */
  isGeneralPool?: number | null;
}
