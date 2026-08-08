/**
 * TypeScript interfaces for the Carerix public CxTools vacancy feeds.
 *
 * Carerix tenants publish their open vacancies as server-rendered, public,
 * unauthenticated XML feeds under `https://{tenant}.carerix.com/cxtools/`
 * (`indeedFeed.php`, `jobboardFeed.php`, `RSSx.php`). The feeds are XML, so there is
 * no JSON wire shape to model; the interfaces below describe the per-vacancy
 * fragment the adapter parses out of a feed `<job>` / `<item>` element and the
 * normalised internal role assembled from it. Everything the adapter reads is
 * optional and defensively narrowed at parse time, so cross-tenant or future-feed
 * drift never breaks the parser.
 */

/**
 * A single vacancy as parsed out of a CxTools feed entry. The field names follow the
 * Indeed XML job schema (the primary feed); the RSS / job-board fallbacks are mapped
 * onto the same shape during parsing. Every field is optional and defensively
 * narrowed because tenants enable different feed variants and custom fields.
 */
export interface CarerixFeedJob {
  /**
   * Stable Carerix `publicationID` — the ATS id. Sourced from the feed's
   * `<referencenumber>` when present, else extracted from the publication's detail /
   * apply URL (`…/vacature-{id}`, `…?pub_id={id}`, `…/joborder/{id}/…`).
   */
  referenceNumber?: string | null;

  /** Human-readable vacancy title (`<title>`). */
  title?: string | null;

  /** Canonical public detail / apply URL of the publication (`<url>` / `<link>`). */
  url?: string | null;

  /** Hiring organisation / brand name (`<company>`), when the feed carries it. */
  company?: string | null;

  /** City of the role (`<city>`). */
  city?: string | null;

  /** State / province / region of the role (`<state>`). */
  state?: string | null;

  /** Country of the role (`<country>`), often `NL` / `Netherlands` for Carerix. */
  country?: string | null;

  /** Raw posted-date text (`<date>` / `<pubDate>`), absolute when present. */
  date?: string | null;

  /** Employment-type / work-type token (`<jobtype>`), e.g. "fulltime". */
  jobType?: string | null;

  /** Category / department text (`<category>`), when present. */
  category?: string | null;

  /** Raw vacancy body — HTML (`<description>`), used as the job description. */
  description?: string | null;
}

/**
 * Normalised view of a single Carerix vacancy, ready to map to a JobPostDto.
 */
export interface CarerixJob {
  /** Stable Carerix `publicationID` — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the publication's canonical page). */
  url: string;

  /** Vacancy display title. */
  title?: string | null;

  /** Hiring-organisation display name (from `<company>`, else derived from the slug). */
  companyName?: string | null;

  /** Structured location parts derived from the feed's location fields. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Department / category label, when the feed carries one. */
  department?: string | null;

  /** Employment-type label (normalised from `<jobtype>`). */
  employmentType?: string | null;

  /** Vacancy body (HTML), format-converted per `descriptionFormat` at map time. */
  description?: string | null;

  /** Posted date — parsed from `<date>` / `<pubDate>` when an absolute date exists. */
  datePosted?: string | null;

  /** True when the role advertises remote / hybrid / home-working. */
  isRemote?: boolean | null;
}
