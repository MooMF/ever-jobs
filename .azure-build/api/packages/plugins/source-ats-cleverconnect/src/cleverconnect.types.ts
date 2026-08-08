/**
 * TypeScript interfaces for the CleverConnect public career-site surface.
 *
 * CleverConnect's candidate-facing career board (`career.{tenant}.cleverconnect.com/jobs`)
 * is an Angular SPA, but the server pre-renders the full open-roles payload into the
 * initial HTML document as an Angular **TransferState** JSON island (with JSON
 * punctuation HTML-entity-encoded, see `cleverconnect.constants.ts`). Decoding that
 * island yields a JSON array of structured offer objects. The interfaces below model
 * the subset of each wire offer the adapter reads, plus the normalised internal role
 * assembled from it. Every field the adapter reads is optional and defensively
 * narrowed at parse time, so cross-tenant or future-payload drift never breaks the
 * parser.
 */

/** A `{ id, value }` label token as embedded in an offer's `labels.*` arrays. */
export interface CleverConnectLabel {
  /** Numeric label id. */
  id?: number | null;
  /** Vendor-specific external code (e.g. "CDI", "BAC+2"), when present. */
  meteojobId?: string | null;
  /** Human-readable label value (e.g. "CDI", "Commercial / Vente"). */
  value?: string | null;
}

/** The `labels` bag on an offer — typed loosely; every list is optional. */
export interface CleverConnectLabels {
  /** Employment-type tokens (e.g. `[{ value: 'CDI' }]`). */
  contractTypeList?: CleverConnectLabel[] | null;
  /** Coarse job-family tokens (e.g. `[{ value: 'Commercial / Vente' }]`). */
  macroJobList?: CleverConnectLabel[] | null;
  /** Fine-grained job tokens (e.g. `[{ value: 'Conseiller commercial (H/F)' }]`). */
  jobList?: CleverConnectLabel[] | null;
  /** Industry-field token. */
  industryField?: CleverConnectLabel | null;
}

/** The hiring company sub-object on an offer. */
export interface CleverConnectCompany {
  /** Numeric company id. */
  id?: number | null;
  /** Company display name. */
  name?: string | null;
}

/** The `url` bag on an offer — the canonical/short detail paths and apply redirect. */
export interface CleverConnectOfferUrls {
  /** Tenant search path (e.g. `/Emploi-Macif`). */
  search?: string | null;
  /** Canonical detail path (`/candidat/offres/offre-d-emploi-…-{id}`). */
  jobOffer?: string | null;
  /** Short, stable detail path (`/jobads/{id}`). */
  jobOfferShort?: string | null;
  /** Optional external apply URL (the tenant's underlying ATS). */
  redirect?: string | null;
}

/**
 * A single offer object as embedded in the board's TransferState payload. Only the
 * fields the adapter consumes are modelled; all are optional and narrowed at parse.
 */
export interface CleverConnectOffer {
  /** CleverConnect offer id (string of digits) — the stable ATS id. */
  id?: number | string | null;
  /** ISO-8601 publication timestamp (e.g. "2026-06-02T02:14:06.285Z"). */
  publicationDate?: string | null;
  /** ISO-8601 last-modification timestamp (fallback posted-date source). */
  lastModification?: string | null;
  /** Role title. */
  title?: string | null;
  /** HTML job body. */
  description?: string | null;
  /** HTML about-the-company text (description fallback). */
  companyDescription?: string | null;
  /** Free-text location (e.g. "Guebwiller (68) - Grand Est"). */
  locality?: string | null;
  /** Publication status — only "PUBLISHED" roles are surfaced. */
  status?: string | null;
  /** Hiring company display name (recruiter side). */
  recruiter?: string | null;
  /** Publisher display name (often equal to `recruiter`). */
  publisher?: string | null;
  /** Structured hiring-company object. */
  company?: CleverConnectCompany | null;
  /** True when the contract is permanent (used as a soft remote/contract signal). */
  permanent?: boolean | null;
  /** Vendor external reference (e.g. "2026-8944"), when present. */
  externalReference?: string | null;
  /** Canonical / short detail paths + apply redirect. */
  url?: CleverConnectOfferUrls | null;
  /** Label bag (contract type, job family, industry). */
  labels?: CleverConnectLabels | null;
}

/**
 * Normalised view of a single CleverConnect role, ready to map to a JobPostDto.
 */
export interface CleverConnectJob {
  /** CleverConnect offer id (string) — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the canonical `/jobads/{id}` page). */
  url: string;

  /** Optional external apply URL (tenant's underlying ATS), when present. */
  applyUrl?: string | null;

  /** Job display title. */
  title?: string | null;

  /** Hiring company display name (derived from offer fields or the tenant slug). */
  companyName?: string | null;

  /** Structured location parts derived from the raw `locality` text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used for the remote signal. */
  locationText?: string | null;

  /** HTML (or plain) job body before format conversion. */
  descriptionHtml?: string | null;

  /** Department / job-family label. */
  department?: string | null;

  /** Employment-type label (from the contract-type tokens). */
  employmentType?: string | null;

  /** Posted date — parsed from `publicationDate` → `YYYY-MM-DD`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
