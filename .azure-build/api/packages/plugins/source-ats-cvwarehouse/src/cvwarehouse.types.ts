/**
 * TypeScript interfaces for the CVWarehouse public careers surface.
 *
 * A CVWarehouse tenant board (`jobpage.cvwarehouse.com/?companyGuid={guid}&lang={lang}`) is
 * **server-rendered HTML**: one GET returns every open role as a `<a class="jobLink"
 * data-jobid="…">` anchor plus a sibling hidden `<div data-jobdetail-job-id="…">` detail block
 * carrying the full HTML body and an apply link, all grouped under
 * `data-item-collection="jobCollection-{sectionGuid}"` blocks that bear the section's country /
 * city filter attributes. The adapter parses that single document into the intermediate shapes
 * below, then normalises each role. Everything the adapter reads is optional and defensively
 * narrowed at parse time, so cross-tenant or future-shape drift never breaks the parser.
 */

/**
 * A role as extracted from the board's listing anchor + its sibling detail block. Every field is
 * optional and defensively narrowed; only `atsId` is required downstream to form a stable id.
 */
export interface CvWarehouseListingRow {
  /** Stable numeric ATS id, read from `data-jobid` / `data-jobdetail-job-id` (e.g. `394655`). */
  atsId?: string | null;
  /** Display title, read from the anchor's `<span>` (or the anchor text). */
  title?: string | null;
  /** Title slug, read from `data-titleslug` / the anchor href's `q` param. */
  titleSlug?: string | null;
  /** Section / collection GUID the role belongs to (`jobCollection-{sectionGuid}`). */
  sectionGuid?: string | null;
  /** ISO-3166 numeric country code on the role's collection (`data-filter-country`). */
  countryCode?: string | null;
  /** Free-text city on the role's collection (`data-filter-city`), when present. */
  city?: string | null;
  /** Rendered HTML description body, read from the role's detail block. */
  descriptionHtml?: string | null;
  /** Canonical board deep-link, read from the detail block's `data-canonical-url`. */
  canonicalUrl?: string | null;
  /** Apply-form URL, read from the detail block's apply anchor (`/ApplicationForm/AppForm?…`). */
  applyUrl?: string | null;
}

/**
 * The parsed board document: the tenant's display name (when the page exposes one) plus the
 * extracted role rows. An empty `rows` array means the tenant has no published roles.
 */
export interface CvWarehouseBoard {
  /** Tenant display name, read from the board's Organization JSON-LD `name`, when present. */
  companyName?: string | null;
  /** Every open role extracted from the board document. */
  rows: CvWarehouseListingRow[];
}

/**
 * Normalised view of a single CVWarehouse role, ready to map to a JobPostDto.
 */
export interface CvWarehouseJob {
  /** Stable ATS id (the numeric `data-jobid`, e.g. `394655`). */
  atsId: string;

  /** Absolute public detail URL (the canonical deep-link, or one derived from the GUID + id). */
  url: string;

  /** Absolute public apply URL (the board's `/ApplicationForm/AppForm` flow for this role). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the role's collection filters. */
  city?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
