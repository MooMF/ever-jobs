/**
 * TypeScript interfaces for the ELMO public careers surface.
 *
 * ELMO tenant career boards (`{tenant}.elmotalent.com.au/careers/{board}`) are
 * server-rendered HTML pages that list the tenant's open roles inline, each role row
 * linking to its canonical `/careers/{board}/job/view/{jobId}` detail page. The adapter
 * scrapes that listing HTML (anchoring on the `/job/view/{jobId}` links) into the wire
 * shape below, then normalises each role for mapping to a `JobPostDto`. Everything the
 * adapter reads is optional and defensively narrowed at parse time, so cross-tenant or
 * future-shape drift never breaks the parser.
 */

/**
 * A single role scraped from the server-rendered board listing. Only the fields the
 * adapter can reliably read from the listing HTML are modelled; all are optional and
 * defensively narrowed. Richer fields (department, location, dates) are surfaced when
 * the listing markup exposes them and left null otherwise.
 */
export interface ElmoListingJob {
  /** Numeric per-role id parsed from the `/job/view/{jobId}` link — the stable ATS id. */
  jobId?: string | null;
  /** The `{board}` segment from the role's `/careers/{board}/job/view/{jobId}` link. */
  board?: string | null;
  /** Absolute public detail URL (the canonical career-board job-view page). */
  url?: string | null;
  /** Role display title (the anchor inner text). */
  title?: string | null;
  /** Free-text location string, when the listing exposes one. */
  location?: string | null;
  /** Department / business-unit label, when the listing exposes one. */
  department?: string | null;
  /** Employment-type label (e.g. Full Time / Part Time / Casual), when present. */
  employmentType?: string | null;
  /** Closing / posted date text, when the listing exposes one. */
  date?: string | null;
}

/**
 * Normalised view of a single ELMO role, ready to map to a JobPostDto.
 */
export interface ElmoJob {
  /** Stable ATS id (the numeric `{jobId}` from the `/job/view/{jobId}` URL). */
  atsId: string;

  /** Absolute public detail URL (the canonical career-board job-view page). */
  url: string;

  /** Absolute public apply URL. */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the slug — the board carries no brand name). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used for remote detection. */
  locationText?: string | null;

  /** Department / business-unit label. */
  department?: string | null;

  /** Employment-type label, when present. */
  employmentType?: string | null;

  /** Posted / closing date — parsed when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / hybrid working. */
  isRemote?: boolean | null;
}
