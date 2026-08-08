/**
 * TypeScript interfaces for the Emply (Visma) public careers surface.
 *
 * Emply tenant career sites (`{tenant}.career.emply.com`) are thin server-rendered
 * shells whose open-roles index page embeds the full vacancy set directly in the HTML
 * as a `proceedBatch({ vacancies : JSON.parse('[…]') })` bootstrap call. The adapter
 * extracts and parses that embedded JSON array. The interfaces below describe the
 * subset of the vacancy wire shape the adapter reads plus the normalised internal
 * role assembled from it. Everything the adapter reads is optional and defensively
 * narrowed at parse time, so cross-tenant or future-shape drift never breaks the
 * parser.
 */

/**
 * A single localised translation of a vacancy, as embedded in the index batch. Each
 * vacancy carries one or more translations; the adapter prefers the first translation
 * whose `content` HTML body is non-empty.
 */
export interface EmplyTranslation {
  /** Localised job title. */
  title?: string | null;
  /** Optional video-block title (ignored for the job body). */
  videoTitle?: string | null;
  /** HTML job-ad body for this locale (the rich description). */
  content?: string | null;
}

/**
 * A single vacancy as embedded in the open-roles index batch
 * (`proceedBatch({ vacancies : JSON.parse('[…]') })`). Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface EmplyVacancy {
  /** Internal vacancy guid. */
  id?: string | null;
  /** Internal ad guid. */
  adId?: string | null;
  /** Numeric publishing id (alternate stable id). */
  publishingId?: number | string | null;
  /** Human-facing vacancy number (alternate stable id). */
  number?: number | string | null;
  /**
   * Short opaque per-role slug (e.g. `vgxqup`) — the stable ATS id and the final
   * segment of the canonical detail / apply URL.
   */
  shortId?: string | null;
  /** Default (untranslated) job title. */
  title?: string | null;
  /** URL-safe title slug — the `{titleAsUrl}` segment of the canonical detail URL. */
  titleAsUrl?: string | null;
  /** Department / organisational-unit label, when present. */
  department?: string | null;
  /** Free-text location string, when present (e.g. `Aarhus C Høegh-Guldbergs Gade 4a`). */
  location?: string | null;
  /** ISO publish timestamp, when present. */
  published?: string | null;
  /** ISO creation timestamp, when present. */
  created?: string | null;
  /** ISO application-deadline timestamp, when present. */
  deadline?: string | null;
  /** True when the record is a talent-pool entry rather than a concrete vacancy. */
  talentPool?: boolean | null;
  /** Optional external careers-site ad URL (when the tenant re-hosts the ad). */
  externalCseAdLink?: string | null;
  /** Optional external careers-site apply URL. */
  externalCseApplyLink?: string | null;
  /** Localised translations (title + HTML body). */
  translations?: EmplyTranslation[] | null;
}

/**
 * The embedded index batch payload: a wrapper object whose `vacancies` array is the
 * parsed JSON. Modelled defensively — the adapter narrows `vacancies` to an array.
 */
export interface EmplyVacancyBatch {
  /** The open vacancies for the tenant. */
  vacancies?: EmplyVacancy[] | null;
}

/**
 * Normalised view of a single Emply role, ready to map to a JobPostDto.
 */
export interface EmplyJob {
  /** Stable ATS id (the vacancy `shortId`, falling back to `publishingId` / `number`). */
  atsId: string;

  /** Absolute public detail URL (the canonical career-site job-ad page). */
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

  /** HTML job-ad body (the richest description available), when present. */
  descriptionHtml?: string | null;

  /** Department / organisational-unit label. */
  department?: string | null;

  /** Posted date — parsed from `published` / `created`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
