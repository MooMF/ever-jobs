/**
 * TypeScript interfaces for the Hireserve ATS public careers surface.
 *
 * Hireserve's candidate-facing careers portal is a server-rendered Oracle PL/SQL
 * "wd_portal" web application, so there is no JSON wire shape to model. The
 * interfaces below describe the fragments the adapter parses out of the listing
 * HTML (the `/vacancy/{slug}-{ID}.html` anchors plus the card text around them) and
 * the per-role detail page, and the normalised internal role assembled from them.
 * Everything the adapter reads is optional and defensively narrowed at parse time,
 * so cross-tenant or future-layout drift never breaks the parser.
 */

/**
 * A single role as parsed out of the listing HTML. Assembled from a canonical
 * vacancy anchor (`/vacancy/{title-slug}-{ID}.html`) plus the card text immediately
 * surrounding it (title heading and, where rendered, a location / work-type line).
 */
export interface HireserveListingJob {
  /** Stable Hireserve `p_web_page_id` — the trailing numeric URL segment. The ATS id. */
  id: string;
  /** Title slug — the `{title-slug}` URL segment (e.g. `business-analyst`). */
  slug?: string | null;
  /** Absolute canonical pretty vacancy / apply URL parsed from / built around the anchor. */
  url?: string | null;
  /** Human-readable job title (from the card / anchor text). */
  title?: string | null;
  /** Raw location text (from the card "Location …" line), when present. */
  location?: string | null;
  /** Raw work-type / employment-type text (from the card line), when present. */
  workType?: string | null;
}

/**
 * Fields recovered from a role's server-rendered detail page. The detail page
 * carries no schema.org JSON-LD, so these are read from the page heading, labelled
 * lines, the page `<title>`, and `og:` meta tags — all narrowed defensively.
 */
export interface HireserveJobDetail {
  /** Job title (page heading / `og:title` / `<title>`), when recoverable. */
  title?: string | null;
  /** Job-ad body HTML, when a description block is present. */
  descriptionHtml?: string | null;
  /** Raw location text (from a labelled "Location …" line), when rendered. */
  location?: string | null;
  /** Raw employment-type text (e.g. "Full Time fixed hours"), when rendered. */
  employmentType?: string | null;
  /** Raw salary text, when rendered. */
  salary?: string | null;
  /** Raw department / category text, when rendered. */
  department?: string | null;
  /** Raw closing-date text, when rendered. */
  closingDate?: string | null;
}

/**
 * Normalised view of a single Hireserve role, ready to map to a JobPostDto.
 */
export interface HireserveJob {
  /** Stable Hireserve `p_web_page_id` — used as the ATS id. */
  jobId: string;

  /** Absolute public detail / apply URL (the canonical pretty `/vacancy/` page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the host/slug — the portal carries no brand field). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used as a remote signal / location source. */
  locationText?: string | null;

  /** Job-ad body HTML (from the detail page), used as the description source. */
  descriptionHtml?: string | null;

  /** Department / category label, when present. */
  department?: string | null;

  /** Employment-type label (from the work-type text). */
  employmentType?: string | null;

  /** Posted / closing date — parsed to YYYY-MM-DD when an absolute date is available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
