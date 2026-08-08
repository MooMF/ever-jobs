/**
 * TypeScript interfaces for the LiveHire (Humanforce Talent) public careers surface.
 *
 * LiveHire's candidate-facing careers board (`/careers/{tenant}/jobs`) is a
 * client-rendered SPA whose backing JSON API rejects non-browser clients, so the
 * adapter instead consumes the platform's server-rendered, public, unauthenticated
 * embeddable jobs widget (`/widgets/job-listings/{tenant}`). The widget is HTML, so
 * there is no JSON wire shape to model; the interfaces below describe the parsed
 * fragments the adapter extracts from each job card and the normalised internal
 * role assembled from them. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant or future-layout drift never
 * breaks the parser.
 */

/**
 * A single role as parsed out of the widget HTML. Assembled from a canonical job
 * anchor (`/careers/{tenant}/job/{CODE}/{ID}/{title-slug}`) plus the labelled card
 * text immediately surrounding it ("Location …", "Work Type …", "Salary Range …",
 * "Published At …").
 */
export interface LiveHireWidgetJob {
  /** Opaque LiveHire job id — the `{ID}` URL segment (e.g. `MZV481L9JF`). The ATS id. */
  id: string;
  /** Short company/job code — the `{CODE}` URL segment (e.g. `FTH9G`). */
  code?: string | null;
  /** Title slug — the final `{title-slug}` URL segment (e.g. `officer-security`). */
  slug?: string | null;
  /** Absolute canonical careers job / apply URL parsed from the anchor's href. */
  url?: string | null;
  /** Human-readable job title (from the card heading text). */
  title?: string | null;
  /** Raw location text (from the "Location …" card field). */
  location?: string | null;
  /** Raw work-type text (from the "Work Type …" card field, e.g. "Full Time"). */
  workType?: string | null;
  /** Raw salary-range text (from the "Salary Range …" card field), when present. */
  salaryRange?: string | null;
  /** Raw "Published At …" relative/absolute date text, when present. */
  publishedAt?: string | null;
}

/**
 * Normalised view of a single LiveHire role, ready to map to a JobPostDto.
 */
export interface LiveHireJob {
  /** Opaque LiveHire job id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the canonical careers job page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the widget carries no brand name). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used as the description fallback / remote signal. */
  locationText?: string | null;

  /** Employment-type label (from the work-type text). */
  employmentType?: string | null;

  /** Posted date — parsed from "Published At", when an absolute date is available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
