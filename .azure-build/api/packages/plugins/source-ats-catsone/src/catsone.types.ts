/**
 * TypeScript interfaces for the CATS (catsone.com) portal HTML parser.
 *
 * Because CATS portals serve server-rendered HTML (no anonymous JSON feed),
 * these interfaces represent data extracted by parsing the HTML response
 * rather than deserialised JSON wire shapes.
 *
 * The listing page (`/careers/{portalID}-{name}`) provides titles, URLs,
 * locations, and categories. The detail page
 * (`/careers/{portalID}-{name}/jobs/{jobID}-{slug}`) provides the full
 * HTML description. Both levels are modelled here.
 */

/**
 * A job stub parsed from a CATS portal listing page.
 * Fields are set to `null` when the corresponding HTML node is absent.
 */
export interface CatsoneJobStub {
  /** Numeric job order ID extracted from the job URL (e.g. `"16818533"`). Used as `atsId`. */
  atsId: string;

  /** Job title text from the `.cats-job-title` anchor. */
  title: string;

  /** Absolute URL for the job detail page. */
  jobUrl: string;

  /** Location text from `.cats-job-location`, e.g. `"Sarajevo (Hybrid), Bosnia & Herzegovina"`. */
  location: string | null;

  /** Category / department text from `.cats-job-category`. */
  category: string | null;
}

/**
 * A fully enriched CATS job including the HTML description fetched from the
 * detail page. Extends `CatsoneJobStub` with optional description content.
 */
export interface CatsoneJobDetail extends CatsoneJobStub {
  /**
   * Inner HTML of the job description container on the detail page.
   * `null` when the detail fetch was skipped or failed.
   */
  descriptionHtml: string | null;
}

/**
 * Parsed tenant context resolved from `companySlug` or `companyUrl`.
 *
 * Holds the host base URL, the portal path (if already known), and the
 * company display name derived from the slug.
 */
export interface CatsoneTenantContext {
  /** Full base URL, e.g. `"https://authoritypartnersinc.catsone.com"`. */
  host: string;

  /**
   * Pre-resolved portal path if the caller's `companyUrl` already pointed
   * directly at a portal listing, e.g. `"/careers/86212-General"`.
   * `null` when the adapter must discover portals from the tenant root.
   */
  portalPath: string | null;

  /** Display name derived from the slug, e.g. `"Authority Partners Inc"`. */
  companyName: string;
}
