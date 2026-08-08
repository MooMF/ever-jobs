/**
 * TypeScript interfaces for the Softy (softy.pro) public careers surface.
 *
 * Softy's candidate-facing careers board (`https://{tenant}.softy.pro/offres`) is a
 * server-rendered HTML index — there is no public JSON wire shape to model. The
 * interfaces below describe the fragments the adapter parses out of each job card on
 * the index (assembled from the canonical `/offre/{ID}-{title-slug}` anchor plus the
 * labelled text around it) and the normalised internal role assembled from them.
 * Everything the adapter reads is optional and defensively narrowed at parse time, so
 * cross-tenant or future-layout drift never breaks the parser.
 */

/**
 * A single role as parsed out of the index HTML. Assembled from a canonical detail
 * anchor (`/offre/{ID}-{title-slug}`) plus the labelled card text immediately
 * surrounding it (title heading, location city, contract type, "Mise en ligne le
 * DD/MM/YYYY").
 */
export interface SoftyCardJob {
  /** Numeric Softy job id — the `{ID}` URL segment (e.g. `208303`). The ATS id. */
  id: string;
  /** Title slug — the trailing `{title-slug}` URL segment (e.g. `manager-it-workplace-h-f`). */
  slug?: string | null;
  /** Absolute canonical detail / apply URL parsed from the anchor's href. */
  url?: string | null;
  /** Human-readable job title (from the card heading text, else de-slugified). */
  title?: string | null;
  /** Raw location text (the work-location city, e.g. "Toulouse"). */
  location?: string | null;
  /** Raw contract-type text (e.g. "CDI", "Apprentissage - 24 Mois"). */
  contractType?: string | null;
  /** Raw "Mise en ligne le DD/MM/YYYY" published-date text, when present. */
  publishedAt?: string | null;
}

/**
 * Normalised view of a single Softy role, ready to map to a JobPostDto.
 */
export interface SoftyJob {
  /** Numeric Softy job id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the canonical `/offre/{ID}-{slug}` page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the card carries no brand name). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used as a remote signal and listing fallback. */
  locationText?: string | null;

  /** Employment-type label (from the contract-type text). */
  employmentType?: string | null;

  /** Posted date — parsed from "Mise en ligne le …" into YYYY-MM-DD, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / télétravail. */
  isRemote?: boolean | null;

  /** Job-body description text recovered best-effort from the detail page. */
  description?: string | null;
}
