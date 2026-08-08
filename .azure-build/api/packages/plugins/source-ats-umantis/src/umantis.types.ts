/**
 * TypeScript interfaces for the Umantis (Haufe Talent) public recruiting surface.
 *
 * Umantis's candidate-facing board (`recruitingapp-{tenantId}.umantis.com/Jobs/All`)
 * is server-rendered HTML, not a JSON API, so there is no JSON wire shape to model.
 * The interfaces below describe the fragments the adapter parses out of the index
 * and detail HTML and the normalised internal role assembled from them. Everything
 * the adapter reads is optional and defensively narrowed at parse time, so
 * cross-tenant or future-layout drift never breaks the parser.
 */

/**
 * A single role as parsed out of the open-roles index HTML. Assembled from a
 * canonical vacancy anchor (`/Vacancies/{ID}/Description/{langCode}`) plus the
 * labelled card text immediately surrounding it (title, location, posting date).
 */
export interface UmantisIndexJob {
  /** Numeric Umantis vacancy id — the `{ID}` URL segment (e.g. `1410`). The ATS id. */
  id: string;
  /** Description language code — the trailing `{langCode}` URL segment (e.g. `1`). */
  langCode?: string | null;
  /** Absolute canonical vacancy detail / apply URL built from the anchor. */
  url?: string | null;
  /** Human-readable job title (from the card text). */
  title?: string | null;
  /** Raw location text (from the card, e.g. "Regensburg" / "Munich (Germany)"). */
  location?: string | null;
  /** Raw posting-date text (`DD.MM.YYYY`) from the card, when present. */
  datePosted?: string | null;
}

/**
 * The richer per-role fields recovered from a vacancy detail page, when the adapter
 * fetches it. All optional and defensively narrowed.
 */
export interface UmantisDetail {
  /** Detail-page title (from the `<title>` tag: "{title} | {organisation}"). */
  title?: string | null;
  /** Organisation / company display name (the tail of the `<title>` tag). */
  companyName?: string | null;
  /** Free-text location recovered from the detail body. */
  location?: string | null;
  /** Employment-type label recovered from the detail body, when present. */
  employmentType?: string | null;
  /** Raw posting-date text (`DD.MM.YYYY`) recovered from the detail body. */
  datePosted?: string | null;
  /** Job-ad body text/HTML recovered from the detail page, when present. */
  description?: string | null;
  /** Apply URL (the detail page's "Apply here / Hier bewerben" target), when present. */
  applyUrl?: string | null;
}

/**
 * Normalised view of a single Umantis role, ready to map to a JobPostDto.
 */
export interface UmantisJob {
  /** Numeric Umantis vacancy id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail URL (the canonical vacancy page). */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Organisation display name (from the detail page, else derived from the tenant id). */
  companyName?: string | null;

  /** Structured location parts derived from the raw location text. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used as a description fallback / remote signal. */
  locationText?: string | null;

  /** Employment-type label, when recovered. */
  employmentType?: string | null;

  /** Posted date — parsed to `YYYY-MM-DD` from a `DD.MM.YYYY` value, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-office working. */
  isRemote?: boolean | null;

  /** Job-ad body text/HTML, when recovered from the detail page. */
  description?: string | null;

  /** Apply URL (the detail page's apply target), when recovered; else the detail URL. */
  applyUrl?: string | null;
}
