/**
 * TypeScript interfaces for the EasyCruit public vacancy-list XML feed.
 *
 * The feed (`GET /export/xml/vacancy/list.xml`) returns a single
 * `<VacancyList>` envelope (namespace `urn:EasyCruit`) whose `vacancies` array
 * holds the tenant's open roles. EasyCruit serves the wire data as XML, so the
 * field names below describe the *parsed* projection produced by this adapter:
 * the canonical XML element/attribute names (e.g. `date_start`, `VacancyURL`)
 * are preserved as `snake_case`/`PascalCase` aliases, with `camelCase` aliases
 * modelled defensively so minor cross-tenant or future-version drift never
 * breaks the parser.
 */

/** A single language `<Version>` block within a `<Vacancy>`. */
export interface EasyCruitVacancyVersion {
  /** Language code of this version (e.g. "en", "gb", "da", "no"). */
  language?: string | null;

  /** Job display title (`<Title>`). */
  title?: string | null;
  Title?: string | null;

  /** Secondary heading / sub-title (`<TitleHeading>`). */
  titleHeading?: string | null;
  TitleHeading?: string | null;

  /** Free-text location string (`<Location>`). */
  location?: string | null;
  Location?: string | null;

  /** Region / state label (`<Region>`). */
  region?: string | null;
  Region?: string | null;

  /** Employment-type / engagement label (`<Engagement>`, e.g. "Full-time"). */
  engagement?: string | null;
  Engagement?: string | null;

  /** Free-text working-hours label (`<DailyHours>`). */
  dailyHours?: string | null;
  DailyHours?: string | null;

  /** Category / function label (`<Categories>`). */
  categories?: string | null;
  Categories?: string | null;

  /** Application deadline as free text (`<ApplicationDeadline>`). */
  applicationDeadline?: string | null;
  ApplicationDeadline?: string | null;
}

/** A single owning `<Department>` block within a `<Vacancy>`. */
export interface EasyCruitDepartment {
  /** Department id attribute — used to reconstruct the canonical vacancy URL. */
  id?: string | null;

  /** Department display name (`<Name>`) — used as the company/department label. */
  name?: string | null;
  Name?: string | null;

  /** Absolute public vacancy / job-detail URL (`<VacancyURL>`). */
  vacancyUrl?: string | null;
  VacancyURL?: string | null;

  /** Absolute public apply URL (`<ApplicationURL>`). */
  applicationUrl?: string | null;
  ApplicationURL?: string | null;

  /** Tenant logo / hero image URLs (not mapped to JobPostDto). */
  logoUrl?: string | null;
  LogoURL?: string | null;
  imageUrl?: string | null;
  ImageURL?: string | null;
}

/** A single open position parsed from a `<Vacancy>` element. */
export interface EasyCruitVacancy {
  /** Stable numeric vacancy id (the `id` attribute) — used as the ATS id. */
  id?: string | number | null;

  /** ISO-8601 publish date (`date_start` attribute). */
  date_start?: string | null;
  dateStart?: string | null;
  /** ISO-8601 close date (`date_end` attribute). */
  date_end?: string | null;
  dateEnd?: string | null;
  /** Timestamp of the last edit (`date_modified` attribute). */
  date_modified?: string | null;
  dateModified?: string | null;

  /** Customer's external reference number (`reference_number`; often empty). */
  reference_number?: string | null;
  referenceNumber?: string | null;

  /** Language `<Version>` blocks attached to the role. */
  versions?: EasyCruitVacancyVersion[] | null;
  Versions?: EasyCruitVacancyVersion[] | null;

  /** Owning `<Department>` blocks. */
  departments?: EasyCruitDepartment[] | null;
  Departments?: EasyCruitDepartment[] | null;
}

/** Top-level envelope returned by `GET /export/xml/vacancy/list.xml`. */
export interface EasyCruitVacancyList {
  /** Open roles for the tenant. */
  vacancies?: EasyCruitVacancy[] | null;
  Vacancies?: EasyCruitVacancy[] | null;
}
