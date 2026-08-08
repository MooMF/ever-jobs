/**
 * TypeScript interfaces for the Eploy public XML vacancy datafeed.
 *
 * The datafeed (`GET /feeds/datafeed.ashx?Format=xml`) returns a custom XML
 * document with root element `<Vacancies Type="Vacancies" Count="N">`, each
 * child `<Item>` representing one open position.
 *
 * These interfaces model the parsed wire shape after extraction from the XML
 * using cheerio in XML mode. All fields are optional/nullable since the feed
 * omits empty elements on some tenants.
 */

/**
 * A single vacancy as extracted from one `<Item>` element in the Eploy XML
 * datafeed. Field names correspond to the XML element names (PascalCase as
 * returned by the feed).
 */
export interface EployVacancyItem {
  /**
   * Numeric vacancy identifier — used as the ATS id and present in the
   * canonical job-page URL.
   * Example: `"2895"`
   */
  VacancyID?: string | null;

  /** Human-readable job title. Example: `"KS1 Class Teacher"` */
  Title?: string | null;

  /**
   * Canonical URL of the vacancy detail page on the tenant career site.
   * Example: `"https://jobs.islington.gov.uk/vacancies/2895/ks1-class-teacher.html"`
   */
  Link?: string | null;

  /**
   * HTML job description wrapped in a CDATA section. May include structured
   * content (responsibilities, requirements, benefits). Can be null or empty.
   */
  Description?: string | null;

  /**
   * Additional benefits content (CDATA HTML). Often empty; merged into
   * description when non-empty.
   */
  Benefits?: string | null;

  /** Free-text location label. Example: `"Islington, London"` */
  Location?: string | null;

  /** Internal numeric location identifier (not mapped to output). */
  LocationID?: string | null;

  /**
   * Department or function category. Example: `"Children and Young People"`.
   * Used as the `department` field in the output DTO.
   */
  Position?: string | null;

  /** Internal numeric position identifier (not mapped to output). */
  PositionID?: string | null;

  /** Industry sector label. Example: `"Children and young people"` */
  Industry?: string | null;

  /** Internal numeric industry identifier (not mapped to output). */
  IndustryID?: string | null;

  /**
   * Employment-type label (e.g. `"Permanent"`, `"Contract"`). Often empty on
   * single-employer portals.
   */
  VacancyType?: string | null;

  /** Internal numeric vacancy-type identifier (not mapped to output). */
  VacancyTypeID?: string | null;

  /**
   * Pre-formatted salary range string. Example: `"£40,317 – £52,300"`.
   * Passed through to the description (no numeric parsing attempted).
   */
  DisplaySalary?: string | null;

  /**
   * Employer / company name. Often empty for single-employer portals where
   * the entire career site belongs to one organisation.
   */
  Company?: string | null;

  /**
   * RFC-1123 date string for when the vacancy was created in the system.
   * Example: `"Wed, 03 Jun 2026 00:00:00 GMT"`
   */
  DateCreated?: string | null;

  /**
   * RFC-1123 date string for when the vacancy was published / posted.
   * Preferred over `DateCreated` for the `datePosted` output field.
   * Example: `"Wed, 03 Jun 2026 00:00:00 GMT"`
   */
  DatePosted?: string | null;

  /** Internal vacancy reference code (often empty). */
  Reference?: string | null;

  /** Free-text qualifications note (often empty). */
  Qualifications?: string | null;
}

/**
 * Parsed metadata extracted from the `<Vacancies>` root element attributes.
 */
export interface EployFeedMeta {
  /** Total number of vacancies in the feed (`Count` attribute on root). */
  count: number;
  /** Array of parsed `<Item>` elements. */
  items: EployVacancyItem[];
}
