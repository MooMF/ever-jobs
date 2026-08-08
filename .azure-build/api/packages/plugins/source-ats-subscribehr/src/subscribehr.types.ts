/**
 * TypeScript interfaces for the Subscribe-HR public careers surface.
 *
 * A Subscribe-HR tenant board (`{tenant}.careers.subscribe-hr.com`) is **server-rendered HTML**
 * with no separate anonymous JSON/RSS endpoint. Every open role is carried inline on the
 * listing page as a self-contained card holding the role's stable numeric vacancy id
 * (`data-vacancyId`), a set of hidden inputs (`jobName`, `jobShortDescription`, `jobUrl`), a
 * `<ul>` of free-text attribute bullets (first bullet = location town), and a short HTML summary
 * (`<div class="job-desc">`). The adapter fetches the listing page(s), parses each card, and
 * reads each role. The interfaces below describe the subset of that card shape the adapter reads
 * plus the normalised internal role assembled from it. Everything the adapter reads is optional
 * and defensively narrowed at parse time, so cross-tenant or future-shape drift never breaks the
 * parser.
 */

/**
 * The raw fields extracted from a single role card on the listing page. All are optional and
 * defensively narrowed at parse time.
 */
export interface SubscribeHrCard {
  /** Stable numeric vacancy id — the ATS id (e.g. `1042`), from `data-vacancyId`. */
  vacancyId?: string | null;
  /** Role display title, from the hidden `jobName` input. */
  jobName?: string | null;
  /** Short role summary, from the hidden `jobShortDescription` input. */
  jobShortDescription?: string | null;
  /** Canonical public `/jobs/{id}-{slug}` detail URL, from the hidden `jobUrl` input. */
  jobUrl?: string | null;
  /** Free-text attribute bullets from the card's `<ul>` (first bullet ≈ location town). */
  attributes?: string[] | null;
  /** Short HTML summary body, from the card's `<div class="job-desc">` block. */
  descriptionHtml?: string | null;
}

/**
 * Normalised view of a single Subscribe-HR role, ready to map to a JobPostDto.
 */
export interface SubscribeHrJob {
  /** Stable ATS id (the role vacancy id, e.g. `1042`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `/jobs/{id}-{slug}` board URL). */
  url: string;

  /** Absolute public apply URL (the detail page hosts the apply control). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the card's first attribute bullet. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Plain-text short summary fallback, when no HTML body is present. */
  descriptionText?: string | null;

  /** Department / category label, when one can be inferred from the attribute bullets. */
  department?: string | null;

  /** Employment-type display label (e.g. `Full Time`), inferred from the attribute bullets. */
  employmentType?: string | null;

  /** Posted date — Subscribe-HR boards rarely expose one, so usually null. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
