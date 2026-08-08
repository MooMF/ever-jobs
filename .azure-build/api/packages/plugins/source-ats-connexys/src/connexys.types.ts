/**
 * TypeScript interfaces for the Connexys public XML vacancy feed.
 *
 * The feed (`GET …/{site}public/run/xml_feed.startup?p_pub_id={id}`) returns a single
 * `<vacancies>` envelope whose `<vacancy>` elements hold the channel's currently-published
 * roles. Connexys serves the wire data as XML, so the field names below describe the *parsed*
 * projection produced by this adapter: the canonical XML tag names (Dutch-language, e.g.
 * `titel`, `plaats`, `omschrijving`) are preserved, with common English/structured aliases
 * modelled defensively so minor cross-tenant or platform-generation drift never breaks the
 * parser. Everything the adapter reads is optional and narrowed at parse time.
 */

/**
 * A single role parsed from a `<vacancy>` element. Each property is optional; the parser
 * resolves the first non-empty alias it finds and degrades to null otherwise.
 */
export interface ConnexysVacancy {
  /** Stable vacancy id (the `id` attribute, or an `<id>` / `<vacancy_id>` child) — the ATS id. */
  id?: string | number | null;

  /** Job display title (`<titel>` / `<title>` / `<functietitel>`). */
  titel?: string | null;
  title?: string | null;

  /** City / place (`<plaats>` / `<standplaats>` / `<city>` / `<location>`). */
  plaats?: string | null;
  city?: string | null;

  /** Region / province / state (`<regio>` / `<provincie>` / `<region>`). */
  regio?: string | null;
  region?: string | null;

  /** Country (`<land>` / `<country>`). */
  land?: string | null;
  country?: string | null;

  /** Rendered description body, usually HTML in a CDATA block (`<omschrijving>` / `<description>`). */
  omschrijving?: string | null;
  description?: string | null;

  /** Function group / category, used as the department (`<functiegroep>` / `<categorie>`). */
  functiegroep?: string | null;
  department?: string | null;

  /** Employment-type label (`<dienstverband>` / `<contract>` / `<employmenttype>`). */
  dienstverband?: string | null;
  employmentType?: string | null;

  /** Weekly hours label (`<uren>` / `<hours>`), surfaced in the synthesised body when present. */
  uren?: string | null;
  hours?: string | null;

  /** Publish date, ISO-ish (`<publicatiedatum>` / `<datum>` / `<date>` / `<publishdate>`). */
  publicatiedatum?: string | null;
  datePosted?: string | null;

  /** Canonical public detail page URL (`<url>` / `<vacature_url>` / `<link>`). */
  url?: string | null;
  link?: string | null;

  /** Apply / application form URL when distinct (`<sollicitatie_url>` / `<apply_url>`). */
  sollicitatie_url?: string | null;
  applyUrl?: string | null;

  /** Publication-channel id this role was published to (`<publicatie_id>`). */
  publicatie_id?: string | number | null;
  channelId?: string | number | null;
}

/** Top-level envelope returned by the feed (`<vacancies>…</vacancies>`). */
export interface ConnexysVacancyList {
  /** Currently-published roles for the channel. */
  vacancies?: ConnexysVacancy[] | null;
}

/**
 * Normalised view of a single Connexys role, ready to map to a JobPostDto. Assembled from the
 * raw `ConnexysVacancy` with all aliases resolved and text cleaned.
 */
export interface ConnexysJob {
  /** Stable ATS id (the vacancy `id`). */
  atsId: string;

  /** Absolute public detail page URL (the canonical `<url>`). */
  url: string;

  /** Absolute public apply URL (the `<sollicitatie_url>` when distinct, else the detail URL). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant / site company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the role's place / region / country. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Department label, derived from the role's function group. */
  department?: string | null;

  /** Employment-type display label (e.g. `Fulltime`). */
  employmentType?: string | null;

  /** Posted date — parsed from `publicatiedatum`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
